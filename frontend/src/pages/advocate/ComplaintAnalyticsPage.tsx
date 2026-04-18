import { useMemo, useState } from "react";
import { Icon } from "../../components/common/Icon";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopHeader } from "../../components/layout/TopHeader";
import { advocateSidebarItems } from "../../data/advocateData";
import { useSidebarNavigation } from "../../hooks/useSidebarNavigation";
import { classNames, formatPercentage } from "../../utils/functions";

type PlatformName = "Careem" | "Bykea" | "foodpanda";
type ComplaintStatus = "Open" | "Escalated" | "Resolved";

type ComplaintCategory =
  | "Commission Hike"
  | "Wrongful Deactivation"
  | "Payment Delay"
  | "Incentive Issue"
  | "App Technical Issue";

interface CategoryCount {
  category: ComplaintCategory;
  count: number;
}

interface PlatformTrendPoint {
  week: string;
  careem: number;
  bykea: number;
  foodpanda: number;
}

interface PlatformVolume {
  platform: PlatformName;
  count: number;
}

const topComplaintCategoriesThisWeek: CategoryCount[] = [
  { category: "Payment Delay", count: 312 },
  { category: "Commission Hike", count: 284 },
  { category: "Wrongful Deactivation", count: 241 },
  { category: "Incentive Issue", count: 188 },
  { category: "App Technical Issue", count: 129 },
];

const complaintVolumeTrend: PlatformTrendPoint[] = [
  { week: "W1", careem: 86, bykea: 63, foodpanda: 104 },
  { week: "W2", careem: 94, bykea: 70, foodpanda: 118 },
  { week: "W3", careem: 101, bykea: 83, foodpanda: 132 },
  { week: "W4", careem: 109, bykea: 88, foodpanda: 141 },
];

const platformComplaintVolume: PlatformVolume[] = [
  { platform: "foodpanda", count: 495 },
  { platform: "Careem", count: 390 },
  { platform: "Bykea", count: 304 },
];

const statusBreakdown: Record<ComplaintStatus, number> = {
  Open: 274,
  Escalated: 198,
  Resolved: 421,
};

const platformColors: Record<PlatformName, string> = {
  Careem: "#2563eb",
  Bykea: "#f97316",
  foodpanda: "#16a34a",
};

const buildChartPoints = (
  values: number[],
  width: number,
  height: number,
  padding: number,
  min: number,
  max: number,
) => {
  const domain = max - min || 1;

  return values.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
    const y = height - padding - ((value - min) / domain) * (height - padding * 2);
    return { x, y };
  });
};

const toLinePath = (points: Array<{ x: number; y: number }>) =>
  points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");

const ComplaintAnalyticsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation();

  const categoryRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return topComplaintCategoriesThisWeek;
    }

    return topComplaintCategoriesThisWeek.filter((item) =>
      item.category.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const maxCategoryCount = Math.max(
    ...topComplaintCategoriesThisWeek.map((item) => item.count),
    1,
  );

  const escalatedVsResolvedRatio =
    statusBreakdown.Escalated / Math.max(statusBreakdown.Resolved, 1);
  const totalHandled = statusBreakdown.Escalated + statusBreakdown.Resolved;

  const highestComplaintPlatform = platformComplaintVolume.reduce((top, current) =>
    current.count > top.count ? current : top,
  );

  const width = 720;
  const height = 260;
  const padding = 28;

  const careemValues = complaintVolumeTrend.map((point) => point.careem);
  const bykeaValues = complaintVolumeTrend.map((point) => point.bykea);
  const foodpandaValues = complaintVolumeTrend.map((point) => point.foodpanda);

  const minTrend = Math.min(...[...careemValues, ...bykeaValues, ...foodpandaValues]) - 8;
  const maxTrend = Math.max(...[...careemValues, ...bykeaValues, ...foodpandaValues]) + 8;

  const careemPoints = buildChartPoints(careemValues, width, height, padding, minTrend, maxTrend);
  const bykeaPoints = buildChartPoints(bykeaValues, width, height, padding, minTrend, maxTrend);
  const foodpandaPoints = buildChartPoints(foodpandaValues, width, height, padding, minTrend, maxTrend);

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
            <TopHeader searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h2 className="text-2xl font-semibold text-[#1d1d1d]">Complaint Analytics</h2>
              <p className="mt-1 text-sm text-[#667085]">
                Category and platform-level complaint patterns derived from grievance board activity.
              </p>
            </section>

            <section className="animate-fade-up grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_8px_25px_rgba(16,24,40,0.05)] xl:col-span-2">
                <p className="text-sm text-[#666f7f]">Escalated vs Resolved Ratio</p>
                <p className="mt-1 text-3xl font-bold text-[#1d1d1d]">{escalatedVsResolvedRatio.toFixed(2)}:1</p>
                <p className="mt-2 text-xs text-[#728097]">
                  {statusBreakdown.Escalated} escalated vs {statusBreakdown.Resolved} resolved complaints.
                </p>
                <div className="mt-4 h-2.5 rounded-full bg-[#e2e7ef]">
                  <div
                    className="h-2.5 rounded-full bg-(--color-button)"
                    style={{ width: `${(statusBreakdown.Escalated / totalHandled) * 100}%` }}
                  />
                </div>
              </article>

              <article className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_8px_25px_rgba(16,24,40,0.05)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#666f7f]">Most Complained Platform</p>
                    <p className="mt-1 text-3xl font-bold text-[#1d1d1d]">{highestComplaintPlatform.platform}</p>
                    <p className="mt-2 text-xs text-[#728097]">{highestComplaintPlatform.count} complaints this week</p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-700">
                    <Icon name="message" className="h-5 w-5" />
                  </span>
                </div>
              </article>

              <article className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_8px_25px_rgba(16,24,40,0.05)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#666f7f]">Open Complaints</p>
                    <p className="mt-1 text-3xl font-bold text-[#1d1d1d]">{statusBreakdown.Open}</p>
                    <p className="mt-2 text-xs text-[#728097]">Awaiting moderation action</p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
                    <Icon name="chart" className="h-5 w-5" />
                  </span>
                </div>
              </article>
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h3 className="text-lg font-semibold text-[#1d1d1d]">Top Complaint Categories This Week</h3>
              <p className="mt-1 text-sm text-[#667085]">Bar chart view of highest-volume complaint categories.</p>

              <div className="mt-4 space-y-3">
                {categoryRows.map((row) => {
                  const widthPercent = (row.count / maxCategoryCount) * 100;

                  return (
                    <div key={row.category} className="rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-3">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-[#1d1d1d]">{row.category}</span>
                        <span className="text-[#4a5568]">{row.count}</span>
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

              {!categoryRows.length ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No complaint categories match your search.
                </p>
              ) : null}
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h3 className="text-lg font-semibold text-[#1d1d1d]">Complaint Volume Over Time per Platform</h3>
              <p className="mt-1 text-sm text-[#667085]">Weekly complaint trend lines across major platforms.</p>

              <div className="mt-5 overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full rounded-xl bg-[#f8f9fb] p-2">
                  {[0, 1, 2, 3].map((guide) => {
                    const y = padding + (guide * (height - padding * 2)) / 3;
                    return (
                      <line
                        key={guide}
                        x1={padding}
                        x2={width - padding}
                        y1={y}
                        y2={y}
                        stroke="#dbe2ec"
                        strokeDasharray="4 4"
                      />
                    );
                  })}

                  <path d={toLinePath(careemPoints)} fill="none" stroke={platformColors.Careem} strokeWidth="3" />
                  <path d={toLinePath(bykeaPoints)} fill="none" stroke={platformColors.Bykea} strokeWidth="3" />
                  <path d={toLinePath(foodpandaPoints)} fill="none" stroke={platformColors.foodpanda} strokeWidth="3" />

                  {careemPoints.map((point, index) => (
                    <circle
                      key={`careem-${complaintVolumeTrend[index].week}`}
                      cx={point.x}
                      cy={point.y}
                      r="3.5"
                      fill="#fff"
                      stroke={platformColors.Careem}
                      strokeWidth="2"
                    />
                  ))}

                  {bykeaPoints.map((point, index) => (
                    <circle
                      key={`bykea-${complaintVolumeTrend[index].week}`}
                      cx={point.x}
                      cy={point.y}
                      r="3.5"
                      fill="#fff"
                      stroke={platformColors.Bykea}
                      strokeWidth="2"
                    />
                  ))}

                  {foodpandaPoints.map((point, index) => (
                    <circle
                      key={`foodpanda-${complaintVolumeTrend[index].week}`}
                      cx={point.x}
                      cy={point.y}
                      r="3.5"
                      fill="#fff"
                      stroke={platformColors.foodpanda}
                      strokeWidth="2"
                    />
                  ))}
                </svg>

                <div
                  className="mt-3 grid gap-2 text-xs text-[#667085]"
                  style={{ gridTemplateColumns: `repeat(${complaintVolumeTrend.length}, minmax(0, 1fr))` }}
                >
                  {complaintVolumeTrend.map((point) => (
                    <span key={point.week} className="text-center">
                      {point.week}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#4b5565]">
                  {(Object.keys(platformColors) as PlatformName[]).map((platform) => (
                    <span key={platform} className="inline-flex items-center gap-2">
                      <span
                        className={classNames("h-2.5 w-2.5 rounded-full")}
                        style={{ backgroundColor: platformColors[platform] }}
                      />
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h3 className="text-lg font-semibold text-[#1d1d1d]">Most Complained-About Platforms</h3>
              <p className="mt-1 text-sm text-[#667085]">Platform ranking by complaint count this week.</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {platformComplaintVolume.map((platform, index) => (
                  <article key={platform.platform} className="rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                    <p className="text-xs text-[#667085]">Rank #{index + 1}</p>
                    <p className="mt-1 text-lg font-semibold text-[#1d1d1d]">{platform.platform}</p>
                    <p className="mt-2 text-sm text-[#4a5568]">{platform.count} complaints</p>
                    <p className="mt-1 text-xs text-[#728097]">
                      Share: {formatPercentage((platform.count / platformComplaintVolume.reduce((sum, item) => sum + item.count, 0)) * 100)}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ComplaintAnalyticsPage;
