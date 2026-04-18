import rateLimit from "express-rate-limit";

export const createPostComplaintLimiter = () =>
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => (req.auth?.userId ? `worker:${req.auth.userId}` : req.ip),
    message: {
      error: "RATE_LIMIT_EXCEEDED",
      message: "You can post at most 5 complaints per hour.",
      status: 429,
    },
  });
