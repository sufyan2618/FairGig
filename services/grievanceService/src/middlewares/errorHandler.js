import { HttpError } from "../utils/httpError.js";

export const notFoundHandler = (_req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: "Endpoint not found.",
    status: 404,
  });
};

export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.code,
      message: err.message,
      status: err.status,
      details: err.details,
    });
    return;
  }

  if (err?.name === "ValidationError") {
    res.status(422).json({
      error: "VALIDATION_ERROR",
      message: "Validation failed.",
      status: 422,
      details: Object.values(err.errors).map((item) => item.message),
    });
    return;
  }

  if (err?.name === "CastError") {
    res.status(400).json({
      error: "INVALID_ID",
      message: "Invalid resource identifier.",
      status: 400,
    });
    return;
  }

  console.error("Unhandled grievance service error", err);
  res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred.",
    status: 500,
  });
};
