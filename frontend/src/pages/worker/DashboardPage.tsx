import { useMemo, useState } from "react";
import { Button } from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { LabeledSelectField } from "../../components/common/LabeledSelectField";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopHeader } from "../../components/layout/TopHeader";
import {
  projectFilterOptions,
  sidebarItems,
  statusFilterOptions,
} from "../../data/dashboardData";
import { useActiveAssignmentsApi } from "../../hooks/api/useActiveAssignmentsApi";
import { useDashboardStatsApi } from "../../hooks/api/useDashboardStatsApi";
import { useShiftLogsApi } from "../../hooks/api/useShiftLogsApi";
import type { SidebarItemId } from "../../types/dashboard";
import { classNames, formatHours, formatPercentage } from "../../utils/functions";
import {
  filterShiftLogs,
  getAssignmentStatusClass,
  getProgressRingStyle,
  getShiftStatusClass,
  type ShiftFilterValue,
} from "../../utils/dashboard/dashboard.utils";

const avatarTones = [
  "bg-blue-100 text-blue-600",
  "bg-green-100 text-green-600",
  "bg-purple-100 text-purple-600",
];

const DashboardPage = () => {
  const [activeSidebarItem, setActiveSidebarItem] =
    useState<SidebarItemId>("log-shift");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<ShiftFilterValue>("all");

  const { data: dashboardStats } = useDashboardStatsApi();
  const { data: assignments } = useActiveAssignmentsApi();
  const { data: shiftLogs } = useShiftLogsApi();

  const filteredShiftLogs = useMemo(
    () => filterShiftLogs(shiftLogs, searchQuery, statusFilter, projectFilter),
    [shiftLogs, searchQuery, statusFilter, projectFilter],
  );

  return (
    <div className="min-h-screen bg-[#eceef2] text-[#1d1d1d]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar
          items={sidebarItems}
          activeItemId={activeSidebarItem}
          onItemSelect={setActiveSidebarItem}
        />

        <main className="relative flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[var(--color-button)]/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#4a5d7d]/10 blur-3xl" />

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
            <TopHeader
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />

            <section className="animate-fade-up grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {dashboardStats.map((stat, index) => (
                <article
                  key={stat.id}
                  className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_8px_25px_rgba(16,24,40,0.05)]"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-[#666f7f]">{stat.label}</p>
                      <p className="mt-1 text-3xl font-bold text-[#1d1d1d]">
                        {stat.value}
                      </p>
                    </div>
                    <span
                      className={classNames(
                        "grid h-10 w-10 place-items-center rounded-xl",
                        stat.iconTint,
                      )}
                    >
                      <Icon name={stat.icon} className="h-5 w-5" />
                    </span>
                  </div>
                </article>
              ))}
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-[#f7f8fa] p-4 md:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-[#1d1d1d]">
                  Active Projects
                </h2>
                <Button leftAdornment={<span className="text-lg leading-none">+</span>}>
                  New Project
                </Button>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                {assignments.map((assignment) => (
                  <article
                    key={assignment.id}
                    className="rounded-2xl border border-[#dde2ea] bg-white p-4 shadow-[0_6px_18px_rgba(16,24,40,0.04)]"
                  >
                    <div className="mb-4 flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-[#1d1d1d]">
                        {assignment.title}
                      </h3>
                      <span
                        className={classNames(
                          "rounded-full px-2.5 py-1 text-xs font-medium",
                          getAssignmentStatusClass(assignment.status),
                        )}
                      >
                        {assignment.status}
                      </span>
                    </div>

                    <div className="mb-5 flex justify-center">
                      <div
                        className="relative h-20 w-20 rounded-full p-[3px]"
                        style={getProgressRingStyle(assignment.completion)}
                      >
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-lg font-bold text-[var(--color-button)]">
                          {formatPercentage(assignment.completion)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#768093]">Budget</p>
                        <p className="font-semibold text-[#1d1d1d]">
                          {assignment.budget}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#768093]">Timeline</p>
                        <p className="font-semibold text-[#1d1d1d]">
                          {assignment.timeline}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#333f57] hover:text-[#1d1d1d]"
                    >
                      Expand Details
                      <span className="text-xs">v</span>
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-[#1d1d1d]">
                  Time Management
                </h2>
                <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto">
                  <LabeledSelectField
                    label="Project"
                    options={projectFilterOptions}
                    value={projectFilter}
                    onChange={setProjectFilter}
                    containerClassName="w-full sm:w-52"
                  />
                  <LabeledSelectField
                    label="Status"
                    options={statusFilterOptions}
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as ShiftFilterValue)}
                    containerClassName="w-full sm:w-40"
                  />
                  <Button size="md">Export PDF</Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-[#657083]">
                      <th className="px-3 py-2 font-medium">Employee</th>
                      <th className="px-3 py-2 font-medium">Project</th>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Hours</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShiftLogs.map((log, index) => (
                      <tr key={log.id} className="rounded-xl bg-[#f8f9fb]">
                        <td className="rounded-l-xl px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={classNames(
                                "grid h-7 w-7 place-items-center rounded-full text-xs font-semibold",
                                avatarTones[index % avatarTones.length],
                              )}
                            >
                              {log.memberInitials}
                            </span>
                            <span className="font-medium text-[#1d1d1d]">
                              {log.memberName}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[#3f4a5f]">{log.assignment}</td>
                        <td className="px-3 py-3 text-[#3f4a5f]">{log.date}</td>
                        <td className="px-3 py-3 font-medium text-[#1d1d1d]">
                          {formatHours(log.hours)}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={classNames(
                              "rounded-full px-2.5 py-1 text-xs font-medium",
                              getShiftStatusClass(log.status),
                            )}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="rounded-r-xl px-3 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="text-sm font-medium text-[#496ab3] hover:text-[#1d1d1d]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className={classNames(
                                "relative h-6 w-11 rounded-full transition-colors",
                                log.isActionEnabled
                                  ? "bg-[#1f2024]"
                                  : "bg-[#d3d7df]",
                              )}
                              aria-label="Toggle action"
                            >
                              <span
                                className={classNames(
                                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                                  log.isActionEnabled
                                    ? "translate-x-[1.35rem]"
                                    : "translate-x-0.5",
                                )}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
