import { PUBLIC_POSTED_BY } from "../config/constants.js";

export const toPublicComplaint = (docOrObj) => {
  const grievance = typeof docOrObj.toJSON === "function" ? docOrObj.toJSON() : docOrObj;

  return {
    id: grievance.id,
    posted_by: PUBLIC_POSTED_BY,
    platform: grievance.platform,
    category: grievance.category,
    description: grievance.description,
    tags: grievance.tags ?? [],
    cluster_id: grievance.clusterId ?? null,
    cluster_label: grievance.clusterLabel ?? null,
    escalation_status: grievance.escalationStatus,
    moderation_note: grievance.moderationNote ?? null,
    is_anonymous: true,
    created_at: grievance.createdAt,
    updated_at: grievance.updatedAt,
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
