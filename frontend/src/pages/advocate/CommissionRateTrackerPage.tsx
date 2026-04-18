import { useMemo, useState } from "react";
import { LabeledSelectField } from "../../components/common/LabeledSelectField";
import { LabeledTextField } from "../../components/common/LabeledTextField";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopHeader } from "../../components/layout/TopHeader";
import {
  advocateCityOptions,
  advocatePlatformOptions,
  advocateSidebarItems,
} from "../../data/advocateData";
import { useSidebarNavigation } from "../../hooks/useSidebarNavigation";
import { classNames, formatPercentage } from "../../utils/functions";

type PlatformName = "Bykea" | "Careem" | "foodpanda";
type CityName = "Karachi" | "Lahore" | "Islamabad";

interface CommissionRow {
  month: string;
  city: CityName;
  platform: PlatformName;
  averageCommission: number;
}

const commissionRows: CommissionRow[] = [
  { month: "Jan 2026", city: "Karachi", platform: "Bykea", averageCommission: 18 },
  { month: "Feb 2026", city: "Karachi", platform: "Bykea", averageCommission: 23 },
  { month: "Mar 2026", city: "Karachi", platform: "Bykea", averageCommission: 27 },
  { month: "Apr 2026", city: "Karachi", platform: "Bykea", averageCommission: 26 },
  { month: "Jan 2026", city: "Karachi", platform: "Careem", averageCommission: 12 },
  { month: "Feb 2026", city: "Karachi", platform: "Careem", averageCommission: 14 },
  { month: "Mar 2026", city: "Karachi", platform: "Careem", averageCommission: 15 },
  { month: "Apr 2026", city: "Karachi", platform: "Careem", averageCommission: 16 },
  { month: "Jan 2026", city: "Karachi", platform: "foodpanda", averageCommission: 20 },
  { month: "Feb 2026", city: "Karachi", platform: "foodpanda", averageCommission: 22 },
  { month: "Mar 2026", city: "Karachi", platform: "foodpanda", averageCommission: 24 },
  { month: "Apr 2026", city: "Karachi", platform: "foodpanda", averageCommission: 25 },

  { month: "Jan 2026", city: "Lahore", platform: "Bykea", averageCommission: 17 },
  { month: "Feb 2026", city: "Lahore", platform: "Bykea", averageCommission: 21 },
  { month: "Mar 2026", city: "Lahore", platform: "Bykea", averageCommission: 24 },
  { month: "Apr 2026", city: "Lahore", platform: "Bykea", averageCommission: 25 },
  { month: "Jan 2026", city: "Lahore", platform: "Careem", averageCommission: 11 },
  { month: "Feb 2026", city: "Lahore", platform: "Careem", averageCommission: 13 },
  { month: "Mar 2026", city: "Lahore", platform: "Careem", averageCommission: 14 },
  { month: "Apr 2026", city: "Lahore", platform: "Careem", averageCommission: 15 },
  { month: "Jan 2026", city: "Lahore", platform: "foodpanda", averageCommission: 19 },
  { month: "Feb 2026", city: "Lahore", platform: "foodpanda", averageCommission: 20 },
  { month: "Mar 2026", city: "Lahore", platform: "foodpanda", averageCommission: 22 },
  { month: "Apr 2026", city: "Lahore", platform: "foodpanda", averageCommission: 23 },

  { month: "Jan 2026", city: "Islamabad", platform: "Bykea", averageCommission: 16 },
  { month: "Feb 2026", city: "Islamabad", platform: "Bykea", averageCommission: 19 },
  { month: "Mar 2026", city: "Islamabad", platform: "Bykea", averageCommission: 22 },
  { month: "Apr 2026", city: "Islamabad", platform: "Bykea", averageCommission: 23 },
  { month: "Jan 2026", city: "Islamabad", platform: "Careem", averageCommission: 10 },
  { month: "Feb 2026", city: "Islamabad", platform: "Careem", averageCommission: 12 },
  { month: "Mar 2026", city: "Islamabad", platform: "Careem", averageCommission: 13 },
  { month: "Apr 2026", city: "Islamabad", platform: "Careem", averageCommission: 14 },
  { month: "Jan 2026", city: "Islamabad", platform: "foodpanda", averageCommission: 18 },
  { month: "Feb 2026", city: "Islamabad", platform: "foodpanda", averageCommission: 19 },
  { month: "Mar 2026", city: "Islamabad", platform: "foodpanda", averageCommission: 21 },
  { month: "Apr 2026", city: "Islamabad", platform: "foodpanda", averageCommission: 22 },
];

const monthOrder = ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026"];
const monthToDateMap: Record<string, string> = {
  "Jan 2026": "2026-01-01",
  "Feb 2026": "2026-02-01",
  "Mar 2026": "2026-03-01",
  "Apr 2026": "2026-04-01",
};

const getMonthDate = (month: string): string => monthToDateMap[month] ?? "";

const platformColors: Record<PlatformName, { stroke: string; fill: string }> = {
  Bykea: { stroke: "#f97316", fill: "rgba(249,115,22,0.16)" },
  Careem: { stroke: "#2563eb", fill: "rgba(37,99,235,0.14)" },
  foodpanda: { stroke: "#16a34a", fill: "rgba(22,163,74,0.14)" },
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

const toAreaPath = (
  points: Array<{ x: number; y: number }>,
  height: number,
  padding: number,
) => {
  if (!points.length) {
    return "";
  }

  const baselineY = height - padding;
  const linePath = toLinePath(points);
  const first = points[0];
  const last = points[points.length - 1];

  return `${linePath} L${last.x},${baselineY} L${first.x},${baselineY} Z`;
};

const CommissionRateTrackerPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation();

  const visibleMonths = useMemo(
    () =>
      monthOrder.filter((month) => {
        const monthDate = getMonthDate(month);
        const matchesStartDate = !startDate || monthDate >= startDate;
        const matchesEndDate = !endDate || monthDate <= endDate;
        return matchesStartDate && matchesEndDate;
      }),
    [startDate, endDate],
  );

  const filteredRows = useMemo(
    () =>
      commissionRows.filter((row) => {
        const matchesPlatform = selectedPlatform === "all" || row.platform === selectedPlatform;
        const matchesCity = selectedCity === "all" || row.city === selectedCity;
        const rowDate = getMonthDate(row.month);
        const matchesStartDate = !startDate || rowDate >= startDate;
        const matchesEndDate = !endDate || rowDate <= endDate;
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          row.platform.toLowerCase().includes(query) ||
          row.city.toLowerCase().includes(query) ||
          row.month.toLowerCase().includes(query);

        return (
          matchesPlatform &&
          matchesCity &&
          matchesStartDate &&
          matchesEndDate &&
          matchesSearch
        );
      }),
    [selectedPlatform, selectedCity, startDate, endDate, searchQuery],
  );

  const chartSeries = useMemo(() => {
    const platforms: PlatformName[] =
      selectedPlatform === "all"
        ? ["Bykea", "Careem", "foodpanda"]
        : [selectedPlatform as PlatformName];

    return platforms.map((platform) => {
      const values = visibleMonths.map((month) => {
        const rows = filteredRows.filter(
          (row) => row.platform === platform && row.month === month,
        );

        if (!rows.length) {
          return 0;
        }

        const average = rows.reduce((sum, row) => sum + row.averageCommission, 0) / rows.length;
        return Number(average.toFixed(1));
      });

      return { platform, values };
    });
  }, [filteredRows, selectedPlatform, visibleMonths]);

  const allValues = chartSeries.flatMap((series) => series.values).filter((value) => value > 0);
  const minValue = allValues.length ? Math.min(...allValues) - 2 : 0;
  const maxValue = allValues.length ? Math.max(...allValues) + 2 : 30;

  const width = 760;
  const height = 290;
  const padding = 34;

  const bykeaValues = chartSeries.find((series) => series.platform === "Bykea")?.values;
  const bykeaFrom = bykeaValues?.[0];
  const bykeaTo = bykeaValues?.[bykeaValues.length - 1];

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
              <h2 className="text-2xl font-semibold text-[#1d1d1d]">Commission Rate Tracker</h2>
              <p className="mt-1 text-sm text-[#667085]">
                Track how worker-reported commission rates have changed over time, broken down by platform and city.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <LabeledSelectField
                  label="Platform"
                  options={advocatePlatformOptions}
                  value={selectedPlatform}
                  onChange={setSelectedPlatform}
                />
                <LabeledSelectField
                  label="City"
                  options={advocateCityOptions}
                  value={selectedCity}
                  onChange={setSelectedCity}
                />
                <LabeledTextField
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  type="date"
                />
                <LabeledTextField
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  type="date"
                />
              </div>
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h3 className="text-lg font-semibold text-[#1d1d1d]">Reported Commission Trend (Line/Area)</h3>
              <p className="mt-1 text-sm text-[#667085]">
                Example insight: Bykea average commission moved from
                {" "}
                <span className="font-semibold text-[#1d1d1d]">
                  {bykeaFrom !== undefined ? formatPercentage(bykeaFrom) : "-"}
                </span>
                {" "}
                to
                {" "}
                <span className="font-semibold text-[#1d1d1d]">
                  {bykeaTo !== undefined ? formatPercentage(bykeaTo) : "-"}
                </span>
                {" "}
                in the selected date range.
              </p>

              <div className="mt-5 overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full rounded-xl bg-[#f8f9fb] p-2">
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

                  {chartSeries.map((series) => {
                    const points = buildChartPoints(
                      series.values,
                      width,
                      height,
                      padding,
                      minValue,
                      maxValue,
                    );
                    const color = platformColors[series.platform];

                    if (points.every((point) => point.y === height - padding)) {
                      return null;
                    }

                    return (
                      <g key={series.platform}>
                        <path d={toAreaPath(points, height, padding)} fill={color.fill} />
                        <path d={toLinePath(points)} fill="none" stroke={color.stroke} strokeWidth="3" />
                        {points.map((point, index) => (
                          <circle
                            key={`${series.platform}-${visibleMonths[index]}`}
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill="#ffffff"
                            stroke={color.stroke}
                            strokeWidth="2"
                          />
                        ))}
                      </g>
                    );
                  })}
                </svg>

                <div className="mt-3 grid gap-2 text-xs text-[#667085]" style={{ gridTemplateColumns: `repeat(${Math.max(visibleMonths.length, 1)}, minmax(0, 1fr))` }}>
                  {visibleMonths.map((month) => (
                    <span key={month} className="text-center">
                      {month}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#4b5565]">
                  {chartSeries.map((series) => (
                    <span key={series.platform} className="inline-flex items-center gap-2">
                      <span
                        className={classNames("h-2.5 w-2.5 rounded-full")}
                        style={{ backgroundColor: platformColors[series.platform].stroke }}
                      />
                      {series.platform}
                    </span>
                  ))}
                </div>
              </div>

              {!visibleMonths.length ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No chart data in selected date range. Adjust start/end date filters.
                </p>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CommissionRateTrackerPage;
