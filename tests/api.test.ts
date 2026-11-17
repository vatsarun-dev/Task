import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { Duplex } from "node:stream";
import type { Socket } from "node:net";
import type { Application } from "express";
import { Types } from "mongoose";

process.env.NODE_ENV = "test";

import createApp from "../src/app.js";
import UserModel from "../src/models/user.model.js";
import TeacherModel from "../src/models/teacher.model.js";
import SessionModel from "../src/models/session.model.js";
import { SessionStatus } from "../src/constant/app.constant.js";
import { getUtcDayBounds, parseDateInput } from "../src/utils/date.util.js";

interface InjectOptions {
  method: string;
  url: string;
  body?: unknown;
  rawBody?: string;
}

interface InjectResponse {
  status: number;
  body: Record<string, unknown>;
}

/**
 * Feeds a real HTTP/1.1 request through http.createServer(app) over an
 * in-memory Duplex stream — zero TCP sockets needed, full Express stack exercised.
 */
async function inject(
  app: Application,
  options: InjectOptions,
): Promise<InjectResponse> {
  const payload =
    options.rawBody !== undefined
      ? options.rawBody
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : "";

  const rawRequestLines = [
    `${options.method} ${options.url} HTTP/1.1`,
    "Host: localhost",
    "Connection: close",
  ];

  if (payload) {
    rawRequestLines.push("Content-Type: application/json");
    rawRequestLines.push(`Content-Length: ${Buffer.byteLength(payload)}`);
  }

  const rawRequest = `${rawRequestLines.join("\r\n")}\r\n\r\n${payload}`;

  const server = http.createServer(app);
  const chunks: Buffer[] = [];

  return await new Promise<InjectResponse>((resolve, reject) => {
    const socket = new Duplex({
      read() {
        // data pushed below
      },
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        callback();
      },
      final(callback) {
        callback();
        try {
          const raw = Buffer.concat(chunks).toString("utf8");
          const sep = raw.indexOf("\r\n\r\n");
          const headerPart = sep >= 0 ? raw.slice(0, sep) : raw;
          const bodyPart = sep >= 0 ? raw.slice(sep + 4) : "";
          const statusMatch = headerPart.match(/^HTTP\/\d\.\d\s+(\d+)/);
          const status = statusMatch ? Number(statusMatch[1]) : 500;
          const body = bodyPart
            ? (JSON.parse(bodyPart) as Record<string, unknown>)
            : {};
          resolve({ status, body });
        } catch (err) {
          reject(err);
        }
      },
    });

    Object.defineProperty(socket, "remoteAddress", { value: "127.0.0.1" });
    (socket as unknown as { setTimeout?: () => void }).setTimeout = () => {};
    (socket as unknown as { setNoDelay?: () => void }).setNoDelay = () => {};

    server.emit("connection", socket as unknown as Socket);
    socket.push(Buffer.from(rawRequest, "utf8"));
  });
}

describe("Date utilities", () => {
  it("parses millisecond timestamps, second timestamps, and ISO strings", () => {
    const fromMs = parseDateInput("1795132800000", "dateTimestamp");
    const fromSec = parseDateInput("1795132800", "dateTimestamp");
    const fromIso = parseDateInput("2026-11-20T00:00:00.000Z", "dateTimestamp");

    assert.equal(fromMs.toISOString(), "2026-11-20T00:00:00.000Z");
    assert.equal(fromSec.toISOString(), "2026-11-20T00:00:00.000Z");
    assert.equal(fromIso.toISOString(), "2026-11-20T00:00:00.000Z");
  });

  it("computes exact UTC day boundaries", () => {
    const bounds = getUtcDayBounds(new Date("2026-11-20T15:45:12.345Z"));
    assert.equal(bounds.dayStart.toISOString(), "2026-11-20T00:00:00.000Z");
    assert.equal(bounds.nextDayStart.toISOString(), "2026-11-21T00:00:00.000Z");
    assert.equal(bounds.isoDate, "2026-11-20");
  });
});

describe("Session Booking REST API", () => {
  const app = createApp();

  const origUserFindOne = UserModel.findOne;
  const origUserCreate = UserModel.create;
  const origUserFindById = UserModel.findById;
  const origTeacherFindById = TeacherModel.findById;
  const origSessionCreate = SessionModel.create;
  const origSessionFindById = SessionModel.findById;
  const origSessionFindOneAndUpdate = SessionModel.findOneAndUpdate;
  const origSessionAggregate = SessionModel.aggregate;

  afterEach(() => {
    UserModel.findOne = origUserFindOne;
    UserModel.create = origUserCreate;
    UserModel.findById = origUserFindById;
    TeacherModel.findById = origTeacherFindById;
    SessionModel.create = origSessionCreate;
    SessionModel.findById = origSessionFindById;
    SessionModel.findOneAndUpdate = origSessionFindOneAndUpdate;
    SessionModel.aggregate = origSessionAggregate;
  });

  it("GET /health returns 200", async () => {
    const res = await inject(app, { method: "GET", url: "/health" });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it("API 1 - POST /users creates user and rejects duplicate email with 409", async () => {
    const userId = new Types.ObjectId();
    (UserModel as unknown as Record<string, unknown>).findOne = async () => null;
    (UserModel as unknown as Record<string, unknown>).create = async (
      payload: Record<string, unknown>,
    ) => ({
      _id: userId,
      ...payload,
    });

    const createRes = await inject(app, {
      method: "POST",
      url: "/users",
      body: {
        fullName: "Arun Kumar",
        email: "Arun@Example.com",
        phone: "+919876543210",
      },
    });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.success, true);
    assert.equal(
      (createRes.body.data as { email: string }).email,
      "arun@example.com",
    );

    // Duplicate email -> 409 Conflict
    (UserModel as unknown as Record<string, unknown>).findOne = async () => ({
      _id: userId,
      email: "arun@example.com",
    });

    const dupRes = await inject(app, {
      method: "POST",
      url: "/users",
      body: {
        fullName: "Arun Duplicate",
        email: "arun@example.com",
        phone: "+919876543211",
      },
    });
    assert.equal(dupRes.status, 409);
  });

  it("API 2 - POST /sessions validates teacher exists & endTime > startTime, defaults to AVAILABLE", async () => {
    const teacherId = new Types.ObjectId();

    // Invalid endTime <= startTime -> 400
    const invalidTimeRes = await inject(app, {
      method: "POST",
      url: "/sessions",
      body: {
        teacherId: teacherId.toString(),
        startTime: "2026-11-20T12:00:00.000Z",
        endTime: "2026-11-20T11:00:00.000Z",
      },
    });
    assert.equal(invalidTimeRes.status, 400);

    // Teacher not found -> 404
    (TeacherModel as unknown as Record<string, unknown>).findById = async () =>
      null;
    const missingTeacherRes = await inject(app, {
      method: "POST",
      url: "/sessions",
      body: {
        teacherId: teacherId.toString(),
        startTime: "2026-11-20T09:00:00.000Z",
        endTime: "2026-11-20T10:00:00.000Z",
      },
    });
    assert.equal(missingTeacherRes.status, 404);

    // Valid creation -> 201 with status AVAILABLE
    (TeacherModel as unknown as Record<string, unknown>).findById = async () => ({
      _id: teacherId,
      fullName: "Dr. Ananya Sharma",
    });
    (SessionModel as unknown as Record<string, unknown>).create = async (
      payload: Record<string, unknown>,
    ) => ({
      _id: new Types.ObjectId(),
      ...payload,
    });

    const okRes = await inject(app, {
      method: "POST",
      url: "/sessions",
      body: {
        teacherId: teacherId.toString(),
        startTime: "2026-11-20T09:00:00.000Z",
        endTime: "2026-11-20T10:00:00.000Z",
      },
    });
    assert.equal(okRes.status, 201);
    assert.equal(
      (okRes.body.data as { status: string }).status,
      SessionStatus.AVAILABLE,
    );
    assert.equal((okRes.body.data as { userId: null }).userId, null);
  });

  it("API 3 - GET /sessions/available uses MongoDB Aggregation Pipeline with UTC date bounds", async () => {
    let capturedPipeline: unknown[] = [];
    (SessionModel as unknown as Record<string, unknown>).aggregate = async (
      pipeline: unknown[],
    ) => {
      capturedPipeline = pipeline;
      return [
        {
          _id: new Types.ObjectId(),
          status: SessionStatus.AVAILABLE,
          startTime: new Date("2026-11-20T09:00:00.000Z"),
          endTime: new Date("2026-11-20T10:00:00.000Z"),
        },
      ];
    };

    const res = await inject(app, {
      method: "GET",
      url: "/sessions/available?dateTimestamp=1795132800000",
    });

    assert.equal(res.status, 200);
    assert.equal((res.body.meta as { date: string }).date, "2026-11-20");
    assert.equal((res.body.meta as { count: number }).count, 1);
    assert.ok(capturedPipeline.length >= 4);
    assert.equal(
      (capturedPipeline[0] as { $match: { status: string } }).$match.status,
      SessionStatus.AVAILABLE,
    );
  });

  it("API 4 - POST /sessions/:id/book enforces existence & prevents double booking", async () => {
    const userId = new Types.ObjectId();
    const sessionId = new Types.ObjectId();

    // User exists + atomic booking succeeds -> 200
    (UserModel as unknown as Record<string, unknown>).findById = async () => ({
      _id: userId,
    });
    (SessionModel as unknown as Record<string, unknown>).findOneAndUpdate =
      async () => ({
        _id: sessionId,
        userId,
        status: SessionStatus.BOOKED,
      });

    const bookRes = await inject(app, {
      method: "POST",
      url: `/sessions/${sessionId}/book`,
      body: { userId: userId.toString() },
    });
    assert.equal(bookRes.status, 200);
    assert.equal(
      (bookRes.body.data as { status: string }).status,
      SessionStatus.BOOKED,
    );

    // Second booking attempt on already BOOKED session -> 409 Conflict
    (SessionModel as unknown as Record<string, unknown>).findOneAndUpdate =
      async () => null;
    (SessionModel as unknown as Record<string, unknown>).findById = async () => ({
      _id: sessionId,
      status: SessionStatus.BOOKED,
    });

    const rebookRes = await inject(app, {
      method: "POST",
      url: `/sessions/${sessionId}/book`,
      body: { userId: userId.toString() },
    });
    assert.equal(rebookRes.status, 409);
  });

  it("API 5 - PATCH /sessions/:id/complete completes BOOKED sessions & rejects AVAILABLE/COMPLETED", async () => {
    const sessionId = new Types.ObjectId();

    // Completing AVAILABLE session -> 400
    (SessionModel as unknown as Record<string, unknown>).findOneAndUpdate =
      async () => null;
    (SessionModel as unknown as Record<string, unknown>).findById = async () => ({
      _id: sessionId,
      status: SessionStatus.AVAILABLE,
    });

    const availRes = await inject(app, {
      method: "PATCH",
      url: `/sessions/${sessionId}/complete`,
    });
    assert.equal(availRes.status, 400);

    // Completing BOOKED session -> 200 with completedAt
    const now = new Date();
    (SessionModel as unknown as Record<string, unknown>).findOneAndUpdate =
      async () => ({
        _id: sessionId,
        status: SessionStatus.COMPLETED,
        completedAt: now,
      });

    const completeRes = await inject(app, {
      method: "PATCH",
      url: `/sessions/${sessionId}/complete`,
    });
    assert.equal(completeRes.status, 200);
    assert.equal(
      (completeRes.body.data as { status: string }).status,
      SessionStatus.COMPLETED,
    );
    assert.ok((completeRes.body.data as { completedAt: string }).completedAt);
  });

  it("API 6 - GET /users/:id/sessions uses Aggregation Pipeline ($facet) for upcoming & completed sessions", async () => {
    const userId = new Types.ObjectId();
    let capturedPipeline: unknown[] = [];

    (UserModel as unknown as Record<string, unknown>).findById = async () => ({
      _id: userId,
    });
    (SessionModel as unknown as Record<string, unknown>).aggregate = async (
      pipeline: unknown[],
    ) => {
      capturedPipeline = pipeline;
      return [
        {
          upcomingSessions: [{ _id: new Types.ObjectId(), status: "BOOKED" }],
          completedSessions: [
            { _id: new Types.ObjectId(), status: "COMPLETED" },
          ],
        },
      ];
    };

    const res = await inject(app, {
      method: "GET",
      url: `/users/${userId}/sessions`,
    });

    assert.equal(res.status, 200);
    assert.equal((res.body.meta as { upcomingCount: number }).upcomingCount, 1);
    assert.equal((res.body.meta as { completedCount: number }).completedCount, 1);
    assert.equal(
      (res.body.data as { upcomingSessions: unknown[] }).upcomingSessions.length,
      1,
    );
    assert.equal(
      (res.body.data as { completedSessions: unknown[] }).completedSessions.length,
      1,
    );
    assert.ok(
      capturedPipeline.some(
        (stage) =>
          typeof stage === "object" && stage !== null && "$facet" in stage,
      ),
    );
  });

  it("Returns 404 for unknown routes and 400 for malformed JSON", async () => {
    const notFoundRes = await inject(app, {
      method: "GET",
      url: "/non-existent-route",
    });
    assert.equal(notFoundRes.status, 404);

    const badJsonRes = await inject(app, {
      method: "POST",
      url: "/users",
      rawBody: "{ invalid json",
    });
    assert.equal(badJsonRes.status, 400);
  });
});
