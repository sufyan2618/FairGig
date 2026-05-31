import Grievance from "../models/grievance.model.js";
import { parsePagination } from "../utils/pagination.js";
import { buildPaginationMeta, toPublicComplaint } from "../utils/responseMapper.js";
import { raise } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";
import { buildSuggestedClusters } from "../services/clusterSuggestionService.js";

const pickTopCategory = (categories) => {
  const counts = new Map();
  for (const item of categories) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }

  let winner = null;
  let winnerCount = 0;
  for (const [category, count] of counts.entries()) {
    if (count > winnerCount) {
      winner = category;
      winnerCount = count;
    }
  }

  return winner;
};

export const listClusters = async (_req, res) => {
  logger.info("clusters list requested", { event: "list_clusters" });

  const aggregates = await Grievance.aggregate([
    {
      $match: {
        clusterId: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$clusterId",
        cluster_label: { $first: "$clusterLabel" },
        complaint_count: { $sum: 1 },
        platforms: { $addToSet: "$platform" },
        categories: { $push: "$category" },
        open_count: {
          $sum: { $cond: [{ $eq: ["$escalationStatus", "open"] }, 1, 0] },
        },
        escalated_count: {
          $sum: { $cond: [{ $eq: ["$escalationStatus", "escalated"] }, 1, 0] },
        },
        resolved_count: {
          $sum: { $cond: [{ $eq: ["$escalationStatus", "resolved"] }, 1, 0] },
        },
      },
    },
    { $sort: { complaint_count: -1 } },
  ]);

  const data = aggregates.map((row) => ({
    cluster_id: row._id,
    cluster_label: row.cluster_label,
    complaint_count: row.complaint_count,
    platforms: row.platforms,
    top_category: pickTopCategory(row.categories),
    escalation_breakdown: {
      open: row.open_count,
      escalated: row.escalated_count,
      resolved: row.resolved_count,
    },
  }));

  logger.info("clusters list returned", { event: "list_clusters_success", count: data.length });
  res.status(200).json(data);
};

export const getClusterComplaints = async (req, res) => {
  const pagination = parsePagination(req.query);
  const clusterId = req.params.cluster_id;
  logger.info("cluster complaints requested", { event: "get_cluster_complaints", cluster_id: clusterId });

  const [items, total] = await Promise.all([
    Grievance.find({ clusterId })
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Grievance.countDocuments({ clusterId }),
  ]);

  logger.info("cluster complaints returned", {
    event: "get_cluster_complaints_success",
    cluster_id: clusterId,
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

export const suggestClusters = async (req, res) => {
  const complaintIds = req.body.complaint_ids;
  logger.info("cluster suggestions requested", {
    event: "suggest_clusters",
    complaint_count: complaintIds.length,
  });

  const complaints = await Grievance.find({
    _id: { $in: complaintIds },
  });

  if (!complaints.length) {
    raise(404, "COMPLAINTS_NOT_FOUND", "No complaints found for provided complaint_ids.");
  }

  const suggestions = buildSuggestedClusters(complaints);

  logger.info("cluster suggestions generated", {
    event: "suggest_clusters_success",
    suggestion_count: suggestions.length,
  });

  res.status(200).json({
    suggested_clusters: suggestions,
  });
};
