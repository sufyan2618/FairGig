import { HttpError } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";

export const notFoundHandler = (req, res) => {
  logger.warn("endpoint not found", {
    event: "not_found",
    method: req.method,
    path: req.originalUrl,
  });

  res.status(404).json({
    error: "NOT_FOUND",
    message: "Endpoint not found.",
    status: 404,
  });
};

export const errorHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    logger.warn("application error", {
      event: "app_error",
      method: req.method,
      path: req.originalUrl,
      error_code: err.code,
      status: err.status,
      message: err.message,
    });

    res.status(err.status).json({
      error: err.code,
      message: err.message,
      status: err.status,
      details: err.details,
    });
    return;
  }

  if (err?.name === "ValidationError") {
    logger.warn("validation error", {
      event: "validation_error",
      method: req.method,
      path: req.originalUrl,
    });

    res.status(422).json({
      error: "VALIDATION_ERROR",
      message: "Validation failed.",
      status: 422,
      details: Object.values(err.errors).map((item) => item.message),
    });
    return;
  }

  if (err?.name === "CastError") {
    logger.warn("invalid resource id", {
      event: "cast_error",
      method: req.method,
      path: req.originalUrl,
    });

    res.status(400).json({
      error: "INVALID_ID",
      message: "Invalid resource identifier.",
      status: 400,
    });
    return;
  }

  logger.error("unhandled grievance service error", err, {
    event: "unhandled_error",
    method: req.method,
    path: req.originalUrl,
  });

  res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred.",
    status: 500,
  });
};
