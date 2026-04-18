import { useMemo, useState } from "react";
import { Button } from "../../components/common/Button";
import { LabeledSelectField } from "../../components/common/LabeledSelectField";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopHeader } from "../../components/layout/TopHeader";
import { sidebarItems } from "../../data/dashboardData";
import type { SidebarItemId } from "../../types/dashboard";
import { classNames, formatCurrency, formatPercentage } from "../../utils/functions";

type Timeframe = "weekly" | "monthly";

interface EarningsPoint {
  label: string;
  earnings: number;
  hours: number;
}

interface CommissionPoint {
  label: string;
  careem: number;
  foodpanda: number;
  bykea: number;
}

interface ComparisonPoint {
  category: string;
  worker: number;
  median: number;
}

const weeklyData: EarningsPoint[] = [
  { label: "Mon", earnings: 4200, hours: 7.5 },
  { label: "Tue", earnings: 5100, hours: 8.5 },
  { label: "Wed", earnings: 3900, hours: 7 },
  { label: "Thu", earnings: 5600, hours: 9 },
  { label: "Fri", earnings: 6200, hours: 9.5 },
  { label: "Sat", earnings: 6900, hours: 10 },
  { label: "Sun", earnings: 4700, hours: 7.5 },
];

const monthlyData: EarningsPoint[] = [
  { label: "Nov", earnings: 98000, hours: 168 },
  { label: "Dec", earnings: 105000, hours: 172 },
  { label: "Jan", earnings: 101000, hours: 166 },
  { label: "Feb", earnings: 112000, hours: 176 },
  { label: "Mar", earnings: 118000, hours: 182 },
  { label: "Apr", earnings: 123000, hours: 185 },
];

const commissionData: CommissionPoint[] = [
  { label: "Nov", careem: 12, foodpanda: 15, bykea: 10 },
  { label: "Dec", careem: 11, foodpanda: 14, bykea: 10 },
  { label: "Jan", careem: 13, foodpanda: 15, bykea: 11 },
  { label: "Feb", careem: 12, foodpanda: 16, bykea: 10 },
  { label: "Mar", careem: 11, foodpanda: 14, bykea: 9 },
  { label: "Apr", careem: 10, foodpanda: 13, bykea: 9 },
];

const comparisonData: ComparisonPoint[] = [
  { category: "Ride Hailing", worker: 123000, median: 108500 },
  { category: "Food Delivery", worker: 89700, median: 92300 },
  { category: "Two-Wheeler", worker: 74400, median: 68100 },
];

const timeframeOptions = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const getLineCoordinates = (values: number[], width: number, height: number, padding: number) => {
  if (values.length === 0) {
    return [] as Array<{ x: number; y: number }>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const domain = max - min || 1;

  return values.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
    const y = height - padding - ((value - min) / domain) * (height - padding * 2);
    return { x, y };
  });
};

const getLinePath = (points: Array<{ x: number; y: number }>) =>
  points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");

interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const AnalyticsCard = ({ title, subtitle, children }: AnalyticsCardProps) => (
  <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold text-[#1d1d1d]">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-[#667085]">{subtitle}</p> : null}
      </div>
    </div>
    {children}
  </section>
);

interface SingleLineChartProps {
  labels: string[];
  values: number[];
  colorClass: string;
}

const SingleLineChart = ({ labels, values, colorClass }: SingleLineChartProps) => {
  const width = 640;
  const height = 220;
  const padding = 24;
  const points = getLineCoordinates(values, width, height, padding);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full rounded-xl bg-[#f8f9fb] p-2">
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

        <path d={getLinePath(points)} fill="none" className={classNames("stroke-3", colorClass)} />

        {points.map((point, index) => (
          <circle key={labels[index]} cx={point.x} cy={point.y} r="4" className={classNames("stroke-2", colorClass)} fill="white" />
        ))}
      </svg>

      <div className="mt-3 grid gap-2 text-xs text-[#667085]" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>
        {labels.map((label) => (
          <span key={label} className="text-center">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

const MultiSeriesLineChart = ({ data }: { data: CommissionPoint[] }) => {
  const width = 640;
  const height = 240;
  const padding = 24;

  const careemPoints = getLineCoordinates(
    data.map((point) => point.careem),
    width,
    height,
    padding,
  );
  const foodpandaPoints = getLineCoordinates(
    data.map((point) => point.foodpanda),
    width,
    height,
    padding,
  );
  const bykeaPoints = getLineCoordinates(
    data.map((point) => point.bykea),
    width,
    height,
    padding,
  );

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-60 w-full rounded-xl bg-[#f8f9fb] p-2">
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

        <path d={getLinePath(careemPoints)} fill="none" className="stroke-3 stroke-[#2f6fdf]" />
        <path d={getLinePath(foodpandaPoints)} fill="none" className="stroke-3 stroke-[#ec6a37]" />
        <path d={getLinePath(bykeaPoints)} fill="none" className="stroke-3 stroke-[#18a06b]" />
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#4b5565]">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2f6fdf]" />Careem
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ec6a37]" />foodpanda
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#18a06b]" />Bykea
        </span>
      </div>

      <div className="mt-2 grid gap-2 text-xs text-[#667085]" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
        {data.map((point) => (
          <span key={point.label} className="text-center">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const MyAnalyticsPage = () => {
  const [activeSidebarItem, setActiveSidebarItem] = useState<SidebarItemId>("my-analytics");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");

  const trendData = timeframe === "weekly" ? weeklyData : monthlyData;

  const hourlyRateData = useMemo(
    () => trendData.map((entry) => Number((entry.earnings / entry.hours).toFixed(1))),
    [trendData],
  );

  const totalEarnings = trendData.reduce((sum, row) => sum + row.earnings, 0);
  const avgHourlyRate = hourlyRateData.reduce((sum, value) => sum + value, 0) / Math.max(hourlyRateData.length, 1);

  const primaryComparison = comparisonData[0];
  const delta = primaryComparison.worker - primaryComparison.median;

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

            <section className="animate-fade-up grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <article className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_8px_25px_rgba(16,24,40,0.05)]">
                <p className="text-sm text-[#666f7f]">{timeframe === "weekly" ? "Weekly Earnings" : "Monthly Earnings"}</p>
                <p className="mt-1 text-3xl font-bold text-[#1d1d1d]">{formatCurrency(totalEarnings)}</p>
              </article>

              <article className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_8px_25px_rgba(16,24,40,0.05)]">
                <p className="text-sm text-[#666f7f]">Average Effective Hourly Rate</p>
                <p className="mt-1 text-3xl font-bold text-[#1d1d1d]">{formatCurrency(avgHourlyRate)}</p>
              </article>

              <article className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_8px_25px_rgba(16,24,40,0.05)] sm:col-span-2 xl:col-span-1">
                <p className="text-sm text-[#666f7f]">Vs City Median ({primaryComparison.category})</p>
                <p className="mt-1 text-3xl font-bold text-[#1d1d1d]">{delta >= 0 ? "+" : ""}{formatCurrency(delta)}</p>
              </article>
            </section>

            <AnalyticsCard
              title="Earnings Trend"
              subtitle="Weekly/Monthly earnings trend line chart"
            >
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <LabeledSelectField
                  label="Timeframe"
                  options={timeframeOptions}
                  value={timeframe}
                  onChange={(value) => setTimeframe(value as Timeframe)}
                  containerClassName="w-full sm:w-40"
                />
                <Button size="sm" variant="ghost">Export CSV</Button>
              </div>

              <SingleLineChart
                labels={trendData.map((point) => point.label)}
                values={trendData.map((point) => point.earnings)}
                colorClass="stroke-[#ec6a37]"
              />
            </AnalyticsCard>

            <AnalyticsCard
              title="Effective Hourly Rate"
              subtitle="How much you effectively earn per hour over time"
            >
              <SingleLineChart
                labels={trendData.map((point) => point.label)}
                values={hourlyRateData}
                colorClass="stroke-[#2f6fdf]"
              />
            </AnalyticsCard>

            <AnalyticsCard
              title="Platform Commission Rate Tracker"
              subtitle="How much each platform deducted over time"
            >
              <MultiSeriesLineChart data={commissionData} />

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-3">
                  <p className="text-xs text-[#667085]">Careem Avg</p>
                  <p className="mt-1 text-lg font-semibold text-[#1d1d1d]">
                    {formatPercentage(
                      commissionData.reduce((sum, point) => sum + point.careem, 0) / commissionData.length,
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-3">
                  <p className="text-xs text-[#667085]">foodpanda Avg</p>
                  <p className="mt-1 text-lg font-semibold text-[#1d1d1d]">
                    {formatPercentage(
                      commissionData.reduce((sum, point) => sum + point.foodpanda, 0) / commissionData.length,
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-3">
                  <p className="text-xs text-[#667085]">Bykea Avg</p>
                  <p className="mt-1 text-lg font-semibold text-[#1d1d1d]">
                    {formatPercentage(
                      commissionData.reduce((sum, point) => sum + point.bykea, 0) / commissionData.length,
                    )}
                  </p>
                </div>
              </div>
            </AnalyticsCard>

            <AnalyticsCard
              title="City-wide Anonymized Median Comparison"
              subtitle={`You earned ${formatCurrency(primaryComparison.worker)}, median in your category is ${formatCurrency(primaryComparison.median)}.`}
            >
              <div className="space-y-4">
                {comparisonData.map((point) => {
                  const peak = Math.max(point.worker, point.median);
                  const workerWidth = (point.worker / peak) * 100;
                  const medianWidth = (point.median / peak) * 100;

                  return (
                    <div key={point.category} className="rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                      <p className="mb-3 text-sm font-semibold text-[#344054]">{point.category}</p>

                      <div className="space-y-2">
                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs text-[#667085]">
                            <span>You</span>
                            <span>{formatCurrency(point.worker)}</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-[#e1e7f2]">
                            <div className="h-2.5 rounded-full bg-[#2f6fdf]" style={{ width: `${workerWidth}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs text-[#667085]">
                            <span>Median</span>
                            <span>{formatCurrency(point.median)}</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-[#fde3d5]">
                            <div className="h-2.5 rounded-full bg-[#ec6a37]" style={{ width: `${medianWidth}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AnalyticsCard>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyAnalyticsPage;
