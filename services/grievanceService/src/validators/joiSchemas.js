import Joi from "joi";

import { CATEGORY_VALUES, ESCALATION_VALUES, PLATFORM_VALUES } from "../config/constants.js";

export const createComplaintSchema = Joi.object({
  platform: Joi.string().valid(...PLATFORM_VALUES).required(),
  category: Joi.string().valid(...CATEGORY_VALUES).required(),
  description: Joi.string().trim().min(20).max(1000).required(),
});

export const tagsUpdateSchema = Joi.object({
  tags: Joi.array().items(Joi.string().trim().min(1).max(30)).min(1).max(10).required(),
});

export const statusUpdateSchema = Joi.object({
  escalation_status: Joi.string().valid(...ESCALATION_VALUES).required(),
  moderation_note: Joi.string().trim().allow(null, "").max(500).optional(),
});

export const clusterUpdateSchema = Joi.object({
  cluster_id: Joi.string().trim().pattern(/^[A-Za-z0-9_\-]+$/).required(),
  cluster_label: Joi.string().trim().min(3).max(120).required(),
});

export const suggestClusterSchema = Joi.object({
  complaint_ids: Joi.array().items(Joi.string().trim().required()).min(2).max(200).required(),
});
