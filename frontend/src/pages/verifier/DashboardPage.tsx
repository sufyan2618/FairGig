import { useMemo, useState } from "react";
import { Button } from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { TopHeader } from "../../components/layout/TopHeader";
import { useVerificationQueueApi } from "../../hooks/api/useVerificationQueueApi";
import { useVerifierSidebarNavigation } from "../../hooks/useVerifierSidebarNavigation";
import type { VerifierQuickStat } from "../../types/verifier";
import { classNames } from "../../utils/functions";

const formatCount = (value: number): string =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

const VerifierDashboardPage = () => {
  const { sidebarItems, activeSidebarItem, onSidebarItemSelect } =
    useVerifierSidebarNavigation();
  const { data: queueSubmissions } = useVerificationQueueApi();
  const [searchQuery, setSearchQuery] = useState("");

  const quickStats: VerifierQuickStat[] = useMemo(
    () => [
      {
        id: "pending-verifications",
        label: "Pending Verifications In Queue",
        value: queueSubmissions.length,
        icon: "briefcase",
        iconTint: "bg-amber-100 text-amber-700",
        helperText: "Awaiting verifier action",
      },
      {
        id: "verified-today",
        label: "Total Verified Today",
        value: 37,
        icon: "team",
        iconTint: "bg-emerald-100 text-emerald-700",
        helperText: "Marked as fully verified",
      },
      {
        id: "flagged-today",
        label: "Total Flagged Today",
        value: 9,
        icon: "tool",
        iconTint: "bg-rose-100 text-rose-700",
        helperText: "Needs follow-up review",
      },
    ],
    [queueSubmissions.length],
  );

  const totalQueueActionsToday = useMemo(
    () => quickStats[1].value + quickStats[2].value,
    [],
  );

  return (
    <div className="min-h-screen bg-[#eceef2] text-[#1d1d1d]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full bg-[#232429] text-white lg:min-h-screen lg:w-72">
          <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#141518] to-[#2f3239] ring-1 ring-white/10">
              <span className="text-lg font-bold text-[var(--color-button)]">FG</span>
            </div>
            <div>
              <p className="text-sm font-semibold">FairGig</p>
              <p className="text-xs text-white/60">Verifier Console</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1 px-4 py-4">
            {sidebarItems.map((item) => {
              const isActive = item.id === activeSidebarItem;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSidebarItemSelect(item.id)}
                  className={classNames(
                    "group flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[var(--color-button)] text-white shadow-[0_8px_20px_rgba(255,145,77,0.3)]"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon
                    name={item.icon}
                    className={classNames("h-4 w-4", isActive ? "text-white" : "text-white/70")}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="relative flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[var(--color-button)]/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#4a5d7d]/10 blur-3xl" />

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
            <TopHeader
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-[#f7f8fa] p-4 md:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-[#1d1d1d]">Verifier Workload Overview</h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    Queue-focused snapshot for today. No individual worker financial data is displayed.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  leftAdornment={<Icon name="clock" className="h-4 w-4" />}
                >
                  Refresh Queue
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {quickStats.map((stat) => (
                  <article
                    key={stat.id}
                    className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_8px_25px_rgba(16,24,40,0.05)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-[#667085]">{stat.label}</p>
                        <p className="mt-1 text-3xl font-bold text-[#1d1d1d]">
                          {formatCount(stat.value)}
                        </p>
                        <p className="mt-2 text-xs font-medium text-[#7a8498]">{stat.helperText}</p>
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
              </div>
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[#1d1d1d]">Today Queue Throughput</h3>
                  <p className="mt-1 text-sm text-[#667085]">
                    Total cases resolved today: {formatCount(totalQueueActionsToday)}
                  </p>
                </div>
                <span className="rounded-full bg-[#eef2f7] px-3 py-1 text-xs font-medium text-[#425066]">
                  Last sync: 5 minutes ago
                </span>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default VerifierDashboardPage;
