import mongoose from "mongoose";

import {
  CATEGORY_VALUES,
  ESCALATION_VALUES,
  PLATFORM_VALUES,
  PUBLIC_POSTED_BY,
} from "../config/constants.js";

const grievanceSchema = new mongoose.Schema(
  {
    workerId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    platform: {
      type: String,
      required: true,
      enum: PLATFORM_VALUES,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORY_VALUES,
      index: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 1000,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.length <= 10 &&
          value.every((tag) => typeof tag === "string" && tag.length <= 30),
        message: "tags must contain at most 10 strings with max length 30",
      },
    },
    clusterId: {
      type: String,
      default: null,
      index: true,
      match: [/^[A-Za-z0-9_\-]+$/, "cluster_id must be alphanumeric with underscores or hyphens"],
    },
    clusterLabel: {
      type: String,
      default: null,
      maxlength: 120,
      trim: true,
    },
    escalationStatus: {
      type: String,
      enum: ESCALATION_VALUES,
      default: "open",
      index: true,
    },
    moderationNote: {
      type: String,
      default: null,
      maxlength: 500,
      trim: true,
    },
    isAnonymous: {
      type: Boolean,
      default: true,
      immutable: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.workerId;
        ret.posted_by = PUBLIC_POSTED_BY;
        return ret;
      },
    },
  }
);

grievanceSchema.index({ createdAt: -1 });

const Grievance = mongoose.model("Grievance", grievanceSchema);

export default Grievance;
