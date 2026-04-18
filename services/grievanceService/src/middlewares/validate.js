import { validationResult } from "express-validator";

import { raise } from "../utils/httpError.js";

export const validateJoi = (schema, source = "body") => (req, _res, next) => {
  const target = req[source] ?? {};
  const { error, value } = schema.validate(target, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    raise(
      422,
      "VALIDATION_ERROR",
      "Request validation failed.",
      error.details.map((item) => ({
        message: item.message,
        path: item.path.join("."),
      }))
    );
  }

  req[source] = value;
  return next();
};

export const validateRequest = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  raise(422, "VALIDATION_ERROR", "Request validation failed.", result.array());
};