import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export default function asyncHandler(
  requestHandler: AsyncRequestHandler,
): RequestHandler {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await requestHandler(req, res, next);
    } catch (error: unknown) {
      next(error);
    }
  };
}
