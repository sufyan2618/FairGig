import type { CSSProperties } from "react";
import type {
  AssignmentStatus,
  ShiftLog,
  ShiftStatus,
} from "../../types/dashboard";
import { clampNumber, normalizeSearchQuery } from "../functions";

export type ShiftFilterValue = "all" | "approved" | "pending" | "rejected";

const assignmentStatusClassMap: Record<AssignmentStatus, string> = {
  Active: "bg-green-100 text-green-700",
  Planning: "bg-amber-100 text-amber-700",
  "In Progress": "bg-blue-100 text-blue-700",
};

const shiftStatusClassMap: Record<ShiftStatus, string> = {
  Approved: "bg-green-100 text-green-700",
  Pending: "bg-amber-100 text-amber-700",
  Rejected: "bg-red-100 text-red-700",
};

export const getAssignmentStatusClass = (status: AssignmentStatus): string =>
  assignmentStatusClassMap[status];

export const getShiftStatusClass = (status: ShiftStatus): string =>
  shiftStatusClassMap[status];

export const getProgressRingStyle = (completion: number): CSSProperties => {
  const boundedCompletion = clampNumber(completion, 0, 100);

  return {
    background: `conic-gradient(var(--color-button) ${boundedCompletion * 3.6}deg, #e5e7eb 0deg)`,
  };
};

export const filterShiftLogs = (
  logs: ShiftLog[],
  query: string,
  statusFilter: ShiftFilterValue,
  projectFilter: string,
): ShiftLog[] => {
  const normalizedQuery = normalizeSearchQuery(query);

  return logs.filter((log) => {
    const searchableText = `${log.memberName} ${log.assignment}`.toLowerCase();
    const matchesQuery =
      normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

    const matchesStatus =
      statusFilter === "all" || log.status.toLowerCase() === statusFilter;

    const normalizedProject = log.assignment
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const matchesProject =
      projectFilter === "all" || normalizedProject === projectFilter;

    return matchesQuery && matchesStatus && matchesProject;
  });
};
