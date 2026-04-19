import { PUBLIC_POSTED_BY } from "../config/constants.js";

export const toPublicComplaint = (docOrObj, { viewerUserId = null } = {}) => {
  const grievance =
    typeof docOrObj.toObject === "function"
      ? docOrObj.toObject()
      : typeof docOrObj.toJSON === "function"
      ? docOrObj.toJSON()
      : docOrObj;

  const grievanceId = grievance.id ?? grievance._id?.toString?.() ?? grievance._id;
  const workerId = grievance.workerId ?? grievance.worker_id ?? null;
  const isOwner =
    viewerUserId !== null &&
    viewerUserId !== undefined &&
    workerId !== null &&
    workerId !== undefined &&
    String(workerId) === String(viewerUserId);
  const escalationStatus = grievance.escalationStatus ?? grievance.escalation_status;
  const clusterId = grievance.clusterId ?? grievance.cluster_id ?? null;

  return {
    id: grievanceId,
    posted_by: PUBLIC_POSTED_BY,
    platform: grievance.platform,
    category: grievance.category,
    description: grievance.description,
    tags: grievance.tags ?? [],
    cluster_id: clusterId,
    cluster_label: grievance.clusterLabel ?? null,
    escalation_status: escalationStatus,
    moderation_note: grievance.moderationNote ?? null,
    can_delete: Boolean(isOwner && escalationStatus === "open" && !clusterId),
    is_anonymous: true,
    created_at: grievance.createdAt ?? grievance.created_at,
    updated_at: grievance.updatedAt ?? grievance.updated_at,
  };
};

export const buildPaginationMeta = ({ page, limit, total }) => {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    total_pages: totalPages,
  };
};
