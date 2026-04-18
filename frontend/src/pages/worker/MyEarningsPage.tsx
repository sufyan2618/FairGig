import { Fragment, useMemo, useState } from "react";
import { Button } from "../../components/common/Button";
import { LabeledSelectField } from "../../components/common/LabeledSelectField";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopHeader } from "../../components/layout/TopHeader";
import { sidebarItems } from "../../data/dashboardData";
import type { SidebarItemId } from "../../types/dashboard";
import { classNames } from "../../utils/functions";

type VerificationStatus = "Pending" | "Verified" | "Flagged" | "Unverifiable";

interface EarningsEntry {
  id: string;
  date: string;
  platform: string;
  hours: number;
  gross: number;
  net: number;
  verificationStatus: VerificationStatus;
  screenshotUrl: string;
}

const earningsEntries: EarningsEntry[] = [
  {
    id: "earn-001",
    date: "2026-04-14",
    platform: "Careem",
    hours: 8.5,
    gross: 5600,
    net: 4960,
    verificationStatus: "Pending",
    screenshotUrl:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "earn-002",
    date: "2026-04-13",
    platform: "foodpanda",
    hours: 7,
    gross: 4200,
    net: 3810,
    verificationStatus: "Verified",
    screenshotUrl:
      "https://images.unsplash.com/photo-1616469829526-e7f26db9b7fa?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "earn-003",
    date: "2026-04-12",
    platform: "Bykea",
    hours: 6.5,
    gross: 3800,
    net: 3300,
    verificationStatus: "Flagged",
    screenshotUrl:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "earn-004",
    date: "2026-04-11",
    platform: "InDrive",
    hours: 5.5,
    gross: 3200,
    net: 2870,
    verificationStatus: "Unverifiable",
    screenshotUrl:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "earn-005",
    date: "2026-04-10",
    platform: "Careem",
    hours: 9,
    gross: 6100,
    net: 5480,
    verificationStatus: "Verified",
    screenshotUrl:
      "https://images.unsplash.com/photo-1517420879524-86d64ac2f339?auto=format&fit=crop&w=900&q=80",
  },
];

const statusFilterOptions = [
  { label: "All Status", value: "all" },
  { label: "Pending", value: "Pending" },
  { label: "Verified", value: "Verified" },
  { label: "Flagged", value: "Flagged" },
  { label: "Unverifiable", value: "Unverifiable" },
];

const getStatusBadgeClass = (status: VerificationStatus) => {
  switch (status) {
    case "Pending":
      return "bg-amber-100 text-amber-700";
    case "Verified":
      return "bg-emerald-100 text-emerald-700";
    case "Flagged":
      return "bg-rose-100 text-rose-700";
    case "Unverifiable":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-200 text-slate-700";
  }
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);

const isEntryEditable = (status: VerificationStatus) => status === "Pending" || status === "Flagged";

const MyEarningsPage = () => {
  const [activeSidebarItem, setActiveSidebarItem] = useState<SidebarItemId>("my-earnings");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const filteredEntries = useMemo(
    () =>
      earningsEntries.filter((entry) => {
        const matchesSearch =
          entry.platform.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
          entry.date.includes(searchQuery.trim());
        const matchesStatus = statusFilter === "all" || entry.verificationStatus === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [searchQuery, statusFilter],
  );

  const toggleExpandedRow = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const handleEdit = (entry: EarningsEntry) => {
    if (!isEntryEditable(entry.verificationStatus)) {
      setNotice("Edit is allowed only for unverified entries (Pending or Flagged).");
      return;
    }

    setNotice(`Edit mode opened for ${entry.platform} shift on ${entry.date}.`);
  };

  return (
    <div className="min-h-screen bg-[#eceef2] text-[#1d1d1d]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar
          items={sidebarItems}
          activeItemId={activeSidebarItem}
          onItemSelect={setActiveSidebarItem}
        />

        <main className="relative flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-(--color-button)/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#4a5d7d]/10 blur-3xl" />

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
            <TopHeader searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-[#1d1d1d]">My Earnings</h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    Complete history of submitted shifts with verification and screenshot records.
                  </p>
                </div>

                <LabeledSelectField
                  label="Verification"
                  options={statusFilterOptions}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  containerClassName="w-full sm:w-56"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-[#657083]">
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Platform</th>
                      <th className="px-3 py-2 font-medium">Hours</th>
                      <th className="px-3 py-2 font-medium">Gross</th>
                      <th className="px-3 py-2 font-medium">Net</th>
                      <th className="px-3 py-2 font-medium">Verification Status</th>
                      <th className="px-3 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => {
                      const isExpanded = expandedRowId === entry.id;
                      const canEdit = isEntryEditable(entry.verificationStatus);

                      return (
                        <Fragment key={entry.id}>
                          <tr className="rounded-xl bg-[#f8f9fb]">
                            <td className="rounded-l-xl px-3 py-3 font-medium text-[#1d1d1d]">{entry.date}</td>
                            <td className="px-3 py-3 text-[#3f4a5f]">{entry.platform}</td>
                            <td className="px-3 py-3 text-[#3f4a5f]">{entry.hours}</td>
                            <td className="px-3 py-3 text-[#3f4a5f]">{formatCurrency(entry.gross)}</td>
                            <td className="px-3 py-3 font-medium text-[#1d1d1d]">{formatCurrency(entry.net)}</td>
                            <td className="px-3 py-3">
                              <span
                                className={classNames(
                                  "rounded-full px-2.5 py-1 text-xs font-medium",
                                  getStatusBadgeClass(entry.verificationStatus),
                                )}
                              >
                                {entry.verificationStatus}
                              </span>
                            </td>
                            <td className="rounded-r-xl px-3 py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={() => toggleExpandedRow(entry.id)}>
                                  {isExpanded ? "Hide" : "View"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(entry)}
                                  disabled={!canEdit}
                                  className={classNames(!canEdit && "cursor-not-allowed opacity-50")}
                                  title={
                                    canEdit
                                      ? "Edit this unverified entry"
                                      : "Edit disabled for verified/unverifiable entries"
                                  }
                                >
                                  Edit
                                </Button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded ? (
                            <tr>
                              <td colSpan={7} className="px-3 pb-4 pt-1">
                                <div className="rounded-xl border border-[#dde2ea] bg-white p-4">
                                  <p className="mb-3 text-sm font-medium text-[#344054]">Attached Screenshot</p>
                                  <div className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-[#f7f8fa]">
                                    <img
                                      src={entry.screenshotUrl}
                                      alt={`Shift screenshot for ${entry.platform} on ${entry.date}`}
                                      className="h-56 w-full object-cover md:h-72"
                                      loading="lazy"
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!filteredEntries.length ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No earnings entries match your search and filter.
                </p>
              ) : null}

              {notice ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  {notice}
                </p>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyEarningsPage;
