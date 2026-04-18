import { useMemo, useState } from "react";
import { Icon } from "../../components/common/Icon";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopHeader } from "../../components/layout/TopHeader";
import { advocateSidebarItems } from "../../data/advocateData";
import { useSidebarNavigation } from "../../hooks/useSidebarNavigation";
import { classNames } from "../../utils/functions";

interface AdvocateKpi {
  id: string;
  label: string;
  value: string;
  icon: "team" | "wallet" | "message" | "chart";
  iconTint: string;
  helperText: string;
}

const advocateKpis: AdvocateKpi[] = [
  {
    id: "total-active-workers",
    label: "Total Active Workers",
    value: "12,480",
    icon: "team",
    iconTint: "bg-blue-100 text-blue-600",
    helperText: "+4.1% vs last week",
  },
  {
    id: "verified-earnings-month",
    label: "Total Verified Earnings (This Month)",
    value: "PKR 48.7M",
    icon: "wallet",
    iconTint: "bg-emerald-100 text-emerald-700",
    helperText: "Aggregated across all verified submissions",
  },
  {
    id: "grievances-this-week",
    label: "Total Grievances Filed (This Week)",
    value: "1,136",
    icon: "message",
    iconTint: "bg-amber-100 text-amber-700",
    helperText: "72 new complaints in last 24h",
  },
  {
    id: "top-platform-complaints",
    label: "Top Platform by Complaint Volume",
    value: "foodpanda",
    icon: "chart",
    iconTint: "bg-rose-100 text-rose-700",
    helperText: "428 complaints this week",
  },
];

interface ComplaintByPlatform {
  platform: string;
  complaints: number;
}

const complaintsByPlatform: ComplaintByPlatform[] = [
  { platform: "foodpanda", complaints: 428 },
  { platform: "Careem", complaints: 319 },
  { platform: "Bykea", complaints: 211 },
  { platform: "InDrive", complaints: 178 },
];

const AdvocateDashboardPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation();

  const filteredComplaints = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return complaintsByPlatform;
    }

    return complaintsByPlatform.filter((item) =>
      item.platform.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const maxComplaints = Math.max(...complaintsByPlatform.map((item) => item.complaints));

  return (
    <div className="min-h-screen bg-[#eceef2] text-[#1d1d1d]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar
          items={advocateSidebarItems}
          activeItemId={activeSidebarItem}
          onItemSelect={onSidebarItemSelect}
        />

        <main className="relative flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-(--color-button)/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#4a5d7d]/10 blur-3xl" />

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
            <TopHeader
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h2 className="text-2xl font-semibold text-[#1d1d1d]">Advocate Home</h2>
              <p className="mt-1 text-sm text-[#667085]">
                Bird&apos;s-eye view of worker activity, verified earnings, and grievance pressure points.
              </p>
            </section>

            <section className="animate-fade-up grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {advocateKpis.map((kpi, index) => (
                <article
                  key={kpi.id}
                  className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_8px_25px_rgba(16,24,40,0.05)]"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-[#666f7f]">{kpi.label}</p>
                      <p className="mt-1 text-2xl font-bold text-[#1d1d1d]">{kpi.value}</p>
                    </div>
                    <span
                      className={classNames(
                        "grid h-10 w-10 place-items-center rounded-xl",
                        kpi.iconTint,
                      )}
                    >
                      <Icon name={kpi.icon} className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-[#728097]">{kpi.helperText}</p>
                </article>
              ))}
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h3 className="text-lg font-semibold text-[#1d1d1d]">Complaint Volume by Platform</h3>
              <p className="mt-1 text-sm text-[#667085]">
                Top platform by complaint volume this week is highlighted by the highest bar.
              </p>

              <div className="mt-5 space-y-3">
                {filteredComplaints.map((item) => {
                  const widthPercent = (item.complaints / maxComplaints) * 100;

                  return (
                    <div key={item.platform} className="rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-3">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-[#1d1d1d]">{item.platform}</span>
                        <span className="text-[#4a5568]">{item.complaints} complaints</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[#dde3ec]">
                        <div
                          className="h-2.5 rounded-full bg-(--color-button)"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdvocateDashboardPage;
