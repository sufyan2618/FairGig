import { Router } from "express";

import {
  createComplaint,
  deleteComplaint,
  getComplaintById,
  listComplaints,
} from "../controllers/grievanceController.js";
import {
  getClusterComplaints,
  listClusters,
  suggestClusters,
} from "../controllers/clusterController.js";
import {
  complaintsByPlatform,
  escalationRatio,
  topCategories,
} from "../controllers/analyticsController.js";
import {
  updateCluster,
  updateStatus,
  updateTags,
} from "../controllers/moderationController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { createPostComplaintLimiter } from "../middlewares/rateLimit.js";
import { validateJoi, validateRequest } from "../middlewares/validate.js";
import {
  analyticsQueryValidators,
  clusterParamValidator,
  clusterUpdateFieldValidators,
  complaintListQueryValidators,
  createComplaintFieldValidators,
  objectIdParamValidator,
  statusUpdateFieldValidators,
  suggestClusterFieldValidators,
  tagsUpdateFieldValidators,
} from "../validators/grievanceValidators.js";
import {
  clusterUpdateSchema,
  createComplaintSchema,
  statusUpdateSchema,
  suggestClusterSchema,
  tagsUpdateSchema,
} from "../validators/joiSchemas.js";

const router = Router();
const postComplaintLimiter = createPostComplaintLimiter();

router.use(requireAuth());

router.get(
  "/",
  requireRoles("worker", "verifier", "advocate"),
  complaintListQueryValidators,
  validateRequest,
  listComplaints
);

router.post(
  "/",
  requireRoles("worker"),
  postComplaintLimiter,
  createComplaintFieldValidators,
  validateRequest,
  validateJoi(createComplaintSchema),
  createComplaint
);

router.get(
  "/clusters",
  requireRoles("worker", "advocate"),
  listClusters
);

router.get(
  "/clusters/:cluster_id",
  requireRoles("worker", "advocate"),
  clusterParamValidator,
  complaintListQueryValidators,
  validateRequest,
  getClusterComplaints
);

router.post(
  "/suggest-clusters",
  requireRoles("advocate"),
  suggestClusterFieldValidators,
  validateRequest,
  validateJoi(suggestClusterSchema),
  suggestClusters
);

router.get(
  "/analytics/top-categories",
  requireRoles("advocate"),
  topCategories
);

router.get(
  "/analytics/by-platform",
  requireRoles("advocate"),
  analyticsQueryValidators,
  validateRequest,
  complaintsByPlatform
);

router.get(
  "/analytics/escalation-ratio",
  requireRoles("advocate"),
  escalationRatio
);

router.get(
  "/:id",
  requireRoles("worker", "verifier", "advocate"),
  objectIdParamValidator,
  validateRequest,
  getComplaintById
);

router.delete(
  "/:id",
  requireRoles("worker"),
  objectIdParamValidator,
  validateRequest,
  deleteComplaint
);

router.put(
  "/:id/tags",
  requireRoles("advocate"),
  tagsUpdateFieldValidators,
  validateRequest,
  validateJoi(tagsUpdateSchema),
  updateTags
);

router.put(
  "/:id/status",
  requireRoles("advocate"),
  statusUpdateFieldValidators,
  validateRequest,
  validateJoi(statusUpdateSchema),
  updateStatus
);

router.put(
  "/:id/cluster",
  requireRoles("advocate"),
  clusterUpdateFieldValidators,
  validateRequest,
  validateJoi(clusterUpdateSchema),
  updateCluster
);

export default router;
