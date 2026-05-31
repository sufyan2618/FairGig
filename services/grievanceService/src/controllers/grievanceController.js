import Grievance from "../models/grievance.model.js";
import { parsePagination } from "../utils/pagination.js";
import { buildPaginationMeta, toPublicComplaint } from "../utils/responseMapper.js";
import { raise } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";

const buildFilters = (query) => {
  const filters = {};

  if (query.platform) {
    filters.platform = query.platform;
  }

  if (query.category) {
    filters.category = query.category;
  }

  if (query.escalation_status) {
    filters.escalationStatus = query.escalation_status;
  }

  if (query.cluster_id) {
    filters.clusterId = query.cluster_id;
  }

  if (query.tag) {
    filters.tags = query.tag;
  }

  return filters;
};

export const createComplaint = async (req, res) => {
  logger.info("complaint creation requested", {
    event: "create_complaint",
    user_id: req.auth.userId,
    platform: req.body.platform,
    category: req.body.category,
  });

  const grievance = await Grievance.create({
    workerId: req.auth.userId,
    platform: req.body.platform,
    category: req.body.category,
    description: req.body.description,
    tags: [],
    clusterId: null,
    clusterLabel: null,
    escalationStatus: "open",
    moderationNote: null,
    isAnonymous: true,
  });

  logger.info("complaint created", {
    event: "create_complaint_success",
    complaint_id: grievance.id,
    user_id: req.auth.userId,
  });

  res.status(201).json({ data: toPublicComplaint(grievance, { viewerUserId: req.auth?.userId }) });
};

export const listComplaints = async (req, res) => {
  const pagination = parsePagination(req.query);
  const filters = buildFilters(req.query);

  const [items, total] = await Promise.all([
    Grievance.find(filters)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Grievance.countDocuments(filters),
  ]);

  logger.info("complaints listed", {
    event: "list_complaints",
    user_id: req.auth?.userId,
    page: pagination.page,
    total,
  });

  res.status(200).json({
    data: items.map((item) => toPublicComplaint(item, { viewerUserId: req.auth?.userId })),
    pagination: buildPaginationMeta({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  });
};

export const getComplaintById = async (req, res) => {
  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) {
    raise(404, "COMPLAINT_NOT_FOUND", "Complaint not found.");
  }

  logger.info("complaint fetched", {
    event: "get_complaint",
    complaint_id: req.params.id,
    user_id: req.auth?.userId,
  });

  res.status(200).json({ data: toPublicComplaint(grievance, { viewerUserId: req.auth?.userId }) });
};

export const deleteComplaint = async (req, res) => {
  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) {
    raise(404, "COMPLAINT_NOT_FOUND", "Complaint not found.");
  }

  if (grievance.workerId !== req.auth.userId) {
    raise(403, "FORBIDDEN", "You can delete only your own complaints.");
  }

  if (grievance.escalationStatus !== "open" || grievance.clusterId) {
    raise(
      409,
      "COMPLAINT_LOCKED",
      "Complaint cannot be deleted after moderation or clustering actions."
    );
  }

  await grievance.deleteOne();

  logger.info("complaint deleted", {
    event: "delete_complaint_success",
    complaint_id: req.params.id,
    user_id: req.auth.userId,
  });

  res.status(200).json({
    message: "Complaint deleted successfully.",
  });
};
