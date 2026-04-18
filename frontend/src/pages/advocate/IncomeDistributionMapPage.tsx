import { useMemo, useState } from "react";
import { LabeledSelectField } from "../../components/common/LabeledSelectField";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopHeader } from "../../components/layout/TopHeader";
import {
  advocateCityOptions,
  advocatePlatformOptions,
  advocateSidebarItems,
} from "../../data/advocateData";
import { useSidebarNavigation } from "../../hooks/useSidebarNavigation";
import { classNames, formatCurrency } from "../../utils/functions";

type PlatformName = "Bykea" | "Careem" | "foodpanda";
type CityName = "Karachi" | "Lahore" | "Islamabad";

interface ZoneIncomeRow {
  city: CityName;
  zone: string;
  platform: PlatformName;
  averageNetEarning: number;
  workerCount: number;
}

const zoneIncomeRows: ZoneIncomeRow[] = [
  { city: "Karachi", zone: "DHA", platform: "Careem", averageNetEarning: 4100, workerCount: 248 },
  { city: "Karachi", zone: "DHA", platform: "Bykea", averageNetEarning: 3320, workerCount: 174 },
  { city: "Karachi", zone: "DHA", platform: "foodpanda", averageNetEarning: 2890, workerCount: 198 },
  { city: "Karachi", zone: "Gulshan-e-Iqbal", platform: "Careem", averageNetEarning: 3610, workerCount: 215 },
  { city: "Karachi", zone: "Gulshan-e-Iqbal", platform: "Bykea", averageNetEarning: 2810, workerCount: 168 },
  { city: "Karachi", zone: "Gulshan-e-Iqbal", platform: "foodpanda", averageNetEarning: 2420, workerCount: 173 },

  { city: "Lahore", zone: "Johar Town", platform: "Careem", averageNetEarning: 3820, workerCount: 206 },
  { city: "Lahore", zone: "Johar Town", platform: "Bykea", averageNetEarning: 2960, workerCount: 181 },
  { city: "Lahore", zone: "Johar Town", platform: "foodpanda", averageNetEarning: 2510, workerCount: 194 },
  { city: "Lahore", zone: "Gulberg", platform: "Careem", averageNetEarning: 3990, workerCount: 229 },
  { city: "Lahore", zone: "Gulberg", platform: "Bykea", averageNetEarning: 3180, workerCount: 187 },
  { city: "Lahore", zone: "Gulberg", platform: "foodpanda", averageNetEarning: 2730, workerCount: 214 },

  { city: "Islamabad", zone: "F-10", platform: "Careem", averageNetEarning: 4350, workerCount: 121 },
  { city: "Islamabad", zone: "F-10", platform: "Bykea", averageNetEarning: 3410, workerCount: 108 },
  { city: "Islamabad", zone: "F-10", platform: "foodpanda", averageNetEarning: 2970, workerCount: 132 },
  { city: "Islamabad", zone: "G-11", platform: "Careem", averageNetEarning: 3540, workerCount: 137 },
  { city: "Islamabad", zone: "G-11", platform: "Bykea", averageNetEarning: 2760, workerCount: 112 },
  { city: "Islamabad", zone: "G-11", platform: "foodpanda", averageNetEarning: 2360, workerCount: 125 },
];

interface ZoneAggregate {
  city: CityName;
  zone: string;
  averageNetEarning: number;
  workerCount: number;
}

const IncomeDistributionMapPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation();

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return zoneIncomeRows.filter((row) => {
      const matchesPlatform =
        selectedPlatform === "all" || row.platform === selectedPlatform;
      const matchesCity = selectedCity === "all" || row.city === selectedCity;
      const matchesSearch =
        !query ||
        row.zone.toLowerCase().includes(query) ||
        row.city.toLowerCase().includes(query) ||
        row.platform.toLowerCase().includes(query);

      return matchesPlatform && matchesCity && matchesSearch;
    });
  }, [searchQuery, selectedPlatform, selectedCity]);

  const zoneAggregates = useMemo<ZoneAggregate[]>(() => {
    const grouped = new Map<string, ZoneAggregate>();

    filteredRows.forEach((row) => {
      const key = `${row.city}::${row.zone}`;
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          city: row.city,
          zone: row.zone,
          averageNetEarning: row.averageNetEarning,
          workerCount: row.workerCount,
        });
        return;
      }

      const mergedWorkers = existing.workerCount + row.workerCount;
      const weightedAverage =
        (existing.averageNetEarning * existing.workerCount +
          row.averageNetEarning * row.workerCount) /
        mergedWorkers;

      grouped.set(key, {
        city: row.city,
        zone: row.zone,
        averageNetEarning: Number(weightedAverage.toFixed(0)),
        workerCount: mergedWorkers,
      });
    });

    return Array.from(grouped.values()).sort(
      (first, second) => second.averageNetEarning - first.averageNetEarning,
    );
  }, [filteredRows]);

  const cityAverage =
    zoneAggregates.reduce((sum, zone) => sum + zone.averageNetEarning, 0) /
    Math.max(zoneAggregates.length, 1);

  const highestEarning = Math.max(
    ...zoneAggregates.map((zone) => zone.averageNetEarning),
    1,
  );

  const lowIncomeZones = zoneAggregates.filter(
    (zone) => zone.averageNetEarning < cityAverage * 0.82,
  );

  const topLowIncomeZone = lowIncomeZones[0];

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
              <h2 className="text-2xl font-semibold text-[#1d1d1d]">Income Distribution Map</h2>
              <p className="mt-1 text-sm text-[#667085]">
                City-zone breakdown of worker earnings to identify under-earning areas that may be systematically exploited.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
              </div>
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h3 className="text-lg font-semibold text-[#1d1d1d]">Zone Earning Distribution (Chart)</h3>
              <p className="mt-1 text-sm text-[#667085]">
                Lower bars indicate zones with weaker income outcomes for workers.
              </p>

              <div className="mt-5 space-y-3">
                {zoneAggregates.map((zone) => {
                  const widthPercent = (zone.averageNetEarning / highestEarning) * 100;
                  const isAtRisk = zone.averageNetEarning < cityAverage * 0.82;

                  return (
                    <article
                      key={`${zone.city}-${zone.zone}`}
                      className="rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-3"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#1d1d1d]">{zone.zone}</span>
                          <span className="text-[#667085]">{zone.city}</span>
                          {isAtRisk ? (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                              Low Income Zone
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[#4a5568]">
                          {formatCurrency(zone.averageNetEarning)} avg net
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[#dde3ec]">
                        <div
                          className={classNames(
                            "h-2.5 rounded-full",
                            isAtRisk ? "bg-rose-500" : "bg-(--color-button)",
                          )}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h3 className="text-lg font-semibold text-[#1d1d1d]">Zone Comparison Table</h3>
              <p className="mt-1 text-sm text-[#667085]">
                Compare average net earnings and total worker coverage per zone.
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-[#657083]">
                      <th className="px-3 py-2 font-medium">City</th>
                      <th className="px-3 py-2 font-medium">Zone</th>
                      <th className="px-3 py-2 font-medium">Avg Net Earning</th>
                      <th className="px-3 py-2 font-medium">Worker Count</th>
                      <th className="px-3 py-2 font-medium">Risk Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zoneAggregates.map((zone) => {
                      const isAtRisk = zone.averageNetEarning < cityAverage * 0.82;

                      return (
                        <tr key={`${zone.city}-${zone.zone}-table`} className="rounded-xl bg-[#f8f9fb]">
                          <td className="rounded-l-xl px-3 py-3 text-[#3f4a5f]">{zone.city}</td>
                          <td className="px-3 py-3 font-medium text-[#1d1d1d]">{zone.zone}</td>
                          <td className="px-3 py-3 text-[#3f4a5f]">{formatCurrency(zone.averageNetEarning)}</td>
                          <td className="px-3 py-3 text-[#3f4a5f]">{zone.workerCount}</td>
                          <td className="rounded-r-xl px-3 py-3">
                            <span
                              className={classNames(
                                "rounded-full px-2.5 py-1 text-xs font-medium",
                                isAtRisk
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-emerald-100 text-emerald-700",
                              )}
                            >
                              {isAtRisk ? "Potential Exploitation" : "Stable"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {topLowIncomeZone ? (
                <p className="mt-4 rounded-xl border border-[#f4d6dc] bg-[#fff3f5] px-3 py-2 text-sm text-[#7c2d3a]">
                  Alert: {topLowIncomeZone.zone} ({topLowIncomeZone.city}) is earning significantly below city average.
                  Consider targeted advocacy or platform audit here.
                </p>
              ) : null}

              {!zoneAggregates.length ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No income distribution data for current filters.
                </p>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default IncomeDistributionMapPage;
