import Grievance from "../models/grievance.model.js";
import { logger } from "../utils/logger.js";

const getCurrentWeekRangeUtc = () => {
  const now = new Date();
  const day = now.getUTCDay();
  const mondayOffset = (day + 6) % 7;

  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - mondayOffset, 0, 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  return { start, end };
};

export const topCategories = async (_req, res) => {
  logger.info("top categories requested", { event: "top_categories" });
  const { start, end } = getCurrentWeekRangeUtc();

  const rows = await Grievance.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lt: end,
        },
      },
    },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  logger.info("top categories returned", { event: "top_categories_success", count: rows.length });
  res.status(200).json(
    rows.map((row) => ({
      category: row._id,
      count: row.count,
    }))
  );
};

export const complaintsByPlatform = async (req, res) => {
  logger.info("complaints by platform requested", {
    event: "complaints_by_platform",
    date_from: req.query.date_from,
    date_to: req.query.date_to,
  });
  const match = {};
  if (req.query.date_from || req.query.date_to) {
    match.createdAt = {};
    if (req.query.date_from) {
      match.createdAt.$gte = new Date(`${req.query.date_from}T00:00:00.000Z`);
    }
    if (req.query.date_to) {
      match.createdAt.$lte = new Date(`${req.query.date_to}T23:59:59.999Z`);
    }
  }

  const rows = await Grievance.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          platform: "$platform",
          day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.day": 1 } },
  ]);

  const byPlatform = new Map();
  for (const row of rows) {
    const key = row._id.platform;
    const current = byPlatform.get(key) ?? { platform: key, total: 0, series: [] };
    current.series.push({ date: row._id.day, count: row.count });
    current.total += row.count;
    byPlatform.set(key, current);
  }

  logger.info("complaints by platform returned", {
    event: "complaints_by_platform_success",
    platform_count: byPlatform.size,
  });
  res.status(200).json(Array.from(byPlatform.values()));
};

export const escalationRatio = async (_req, res) => {
  logger.info("escalation ratio requested", { event: "escalation_ratio" });
  const rows = await Grievance.aggregate([
    {
      $group: {
        _id: "$escalationStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  const response = {
    open: 0,
    escalated: 0,
    resolved: 0,
    total: 0,
  };

  for (const row of rows) {
    response[row._id] = row.count;
    response.total += row.count;
  }

  logger.info("escalation ratio returned", { event: "escalation_ratio_success", total: response.total });
  res.status(200).json(response);
};
