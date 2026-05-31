import Grievance from "../models/grievance.model.js";
import { toPublicComplaint } from "../utils/responseMapper.js";
import { raise } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";

const allowedTransitions = {
  open: ["escalated", "resolved"],
  escalated: ["resolved"],
  resolved: ["open"],
};

export const updateTags = async (req, res) => {
  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) {
    raise(404, "COMPLAINT_NOT_FOUND", "Complaint not found.");
  }

  grievance.tags = req.body.tags;
  await grievance.save();

  logger.info("complaint tags updated", {
    event: "update_tags_success",
    complaint_id: req.params.id,
    tag_count: req.body.tags.length,
  });

  res.status(200).json({ data: toPublicComplaint(grievance, { viewerUserId: req.auth?.userId }) });
};

export const updateStatus = async (req, res) => {
  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) {
    raise(404, "COMPLAINT_NOT_FOUND", "Complaint not found.");
  }

  const nextStatus = req.body.escalation_status;
  const currentStatus = grievance.escalationStatus;

  if (nextStatus !== currentStatus) {
    const transitions = allowedTransitions[currentStatus] ?? [];
    if (!transitions.includes(nextStatus)) {
      raise(
        409,
        "INVALID_STATUS_TRANSITION",
        `Cannot transition from ${currentStatus} to ${nextStatus}.`
      );
    }
  }

  grievance.escalationStatus = nextStatus;
  grievance.moderationNote = req.body.moderation_note || null;

  await grievance.save();

  logger.info("complaint status updated", {
    event: "update_status_success",
    complaint_id: req.params.id,
    from_status: currentStatus,
    to_status: nextStatus,
  });

  res.status(200).json({ data: toPublicComplaint(grievance, { viewerUserId: req.auth?.userId }) });
};

export const updateCluster = async (req, res) => {
  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) {
    raise(404, "COMPLAINT_NOT_FOUND", "Complaint not found.");
  }

  grievance.clusterId = req.body.cluster_id;
  grievance.clusterLabel = req.body.cluster_label;

  await grievance.save();

  logger.info("complaint cluster updated", {
    event: "update_cluster_success",
    complaint_id: req.params.id,
    cluster_id: req.body.cluster_id,
  });

  res.status(200).json({ data: toPublicComplaint(grievance, { viewerUserId: req.auth?.userId }) });
};
