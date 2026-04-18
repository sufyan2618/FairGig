import { body, param, query } from "express-validator";

import {
  CATEGORY_VALUES,
  ESCALATION_VALUES,
  MAX_LIMIT,
  PLATFORM_VALUES,
} from "../config/constants.js";

export const objectIdParamValidator = [
  param("id").isMongoId().withMessage("id must be a valid MongoDB ObjectId."),
];

export const clusterParamValidator = [
  param("cluster_id")
    .isString()
    .trim()
    .matches(/^[A-Za-z0-9_\-]+$/)
    .withMessage("cluster_id must contain only alphanumeric characters, underscores, or hyphens."),
];

export const createComplaintFieldValidators = [
  body("platform")
    .isString()
    .trim()
    .isIn(PLATFORM_VALUES)
    .withMessage(`platform must be one of: ${PLATFORM_VALUES.join(", ")}`),
  body("category")
    .isString()
    .trim()
    .isIn(CATEGORY_VALUES)
    .withMessage(`category must be one of: ${CATEGORY_VALUES.join(", ")}`),
  body("description")
    .isString()
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage("description must be between 20 and 1000 characters."),
];

export const complaintListQueryValidators = [
  query("platform").optional().isString().trim().isIn(PLATFORM_VALUES),
  query("category").optional().isString().trim().isIn(CATEGORY_VALUES),
  query("escalation_status").optional().isString().trim().isIn(ESCALATION_VALUES),
  query("cluster_id").optional().isString().trim().matches(/^[A-Za-z0-9_\-]+$/),
  query("tag").optional().isString().trim().isLength({ min: 1, max: 30 }),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: MAX_LIMIT }),
];

export const tagsUpdateFieldValidators = [
  ...objectIdParamValidator,
  body("tags").isArray({ min: 1, max: 10 }).withMessage("tags must be a non-empty array with max 10 items."),
  body("tags.*").isString().trim().isLength({ min: 1, max: 30 }),
];

export const statusUpdateFieldValidators = [
  ...objectIdParamValidator,
  body("escalation_status").isString().trim().isIn(ESCALATION_VALUES),
  body("moderation_note").optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
];

export const clusterUpdateFieldValidators = [
  ...objectIdParamValidator,
  body("cluster_id")
    .isString()
    .trim()
    .matches(/^[A-Za-z0-9_\-]+$/)
    .withMessage("cluster_id must contain only alphanumeric characters, underscores, or hyphens."),
  body("cluster_label").isString().trim().isLength({ min: 3, max: 120 }),
];

export const suggestClusterFieldValidators = [
  body("complaint_ids").isArray({ min: 2, max: 200 }),
  body("complaint_ids.*").isMongoId(),
];

export const analyticsQueryValidators = [
  query("date_from").optional().isISO8601(),
  query("date_to").optional().isISO8601(),
];
