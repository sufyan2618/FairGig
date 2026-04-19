import { useEffect, useMemo, useState } from 'react'
import { LabeledTextField } from '../../components/common/LabeledTextField'
import { ToastOnMessage } from '../../components/common/ToastOnMessage'
import { Sidebar } from '../../components/layout/Sidebar'
import { TopHeader } from '../../components/layout/TopHeader'
import { advocateSidebarItems } from '../../data/advocateData'
import { useAdvocateAnalyticsApi } from '../../hooks/api/useAdvocateAnalyticsApi'
import { useSidebarNavigation } from '../../hooks/useSidebarNavigation'
import { classNames, formatCurrency } from '../../utils/functions'

const IncomeDistributionMapPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation()

  const {
    incomeDistribution,
    isIncomeLoading,
    error,
    fetchIncomeDistribution,
    clearError,
  } = useAdvocateAnalyticsApi()

  useEffect(() => {
    void fetchIncomeDistribution({
      month: selectedMonth || undefined,
      category: selectedCategory || undefined,
    })
  }, [fetchIncomeDistribution, selectedCategory, selectedMonth])

  const zoneAggregates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const zones = incomeDistribution?.zones ?? []

    if (!query) {
      return zones
    }

    return zones.filter((zone) => zone.city_zone.toLowerCase().includes(query))
  }, [incomeDistribution?.zones, searchQuery])

  const numericMedians = zoneAggregates
    .map((zone) => zone.median_net_pkr)
    .filter((median): median is number => typeof median === 'number')

  const cityAverage =
    numericMedians.reduce((sum, value) => sum + value, 0) / Math.max(numericMedians.length, 1)

  const highestEarning = Math.max(...numericMedians, 1)

  const lowIncomeZones = zoneAggregates.filter(
    (zone) => typeof zone.median_net_pkr === 'number' && zone.median_net_pkr < cityAverage * 0.82,
  )

  const topLowIncomeZone = lowIncomeZones[0]

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
            <ToastOnMessage message={error} tone="error" />

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h2 className="text-2xl font-semibold text-[#1d1d1d]">Income Distribution Map</h2>
              <p className="mt-1 text-sm text-[#667085]">
                City-zone distribution of worker income with privacy-aware suppression where cohorts are small.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <LabeledTextField
                  label="Month"
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  type="month"
                />
                <LabeledTextField
                  label="Worker Category"
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="e.g. ride_hailing"
                />
              </div>

            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h3 className="text-lg font-semibold text-[#1d1d1d]">Zone Earning Distribution (Median Net)</h3>
              <p className="mt-1 text-sm text-[#667085]">
                Lower bars indicate zones with weaker median income outcomes.
              </p>

              {isIncomeLoading ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  Loading income distribution data...
                </p>
              ) : null}

              <div className="mt-5 space-y-3">
                {zoneAggregates.map((zone) => {
                  const median = zone.median_net_pkr ?? 0
                  const widthPercent = (median / highestEarning) * 100
                  const isAtRisk = typeof zone.median_net_pkr === 'number' && zone.median_net_pkr < cityAverage * 0.82

                  return (
                    <article
                      key={zone.city_zone}
                      className="rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-3"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#1d1d1d]">{zone.city_zone}</span>
                          {zone.suppressed ? (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                              Suppressed
                            </span>
                          ) : null}
                          {isAtRisk ? (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                              Low Income Zone
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[#4a5568]">
                          {zone.median_net_pkr === null ? 'N/A' : `${formatCurrency(zone.median_net_pkr)} median`}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[#dde3ec]">
                        <div
                          className={classNames(
                            'h-2.5 rounded-full',
                            isAtRisk ? 'bg-rose-500' : 'bg-(--color-button)',
                          )}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h3 className="text-lg font-semibold text-[#1d1d1d]">Zone Comparison Table</h3>
              <p className="mt-1 text-sm text-[#667085]">
                Compare median and percentile income stats by city zone.
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-[#657083]">
                      <th className="px-3 py-2 font-medium">City Zone</th>
                      <th className="px-3 py-2 font-medium">Cohort Size</th>
                      <th className="px-3 py-2 font-medium">P25</th>
                      <th className="px-3 py-2 font-medium">Median</th>
                      <th className="px-3 py-2 font-medium">P75</th>
                      <th className="px-3 py-2 font-medium">Risk Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zoneAggregates.map((zone) => {
                      const isAtRisk = typeof zone.median_net_pkr === 'number' && zone.median_net_pkr < cityAverage * 0.82

                      return (
                        <tr key={`${zone.city_zone}-table`} className="rounded-xl bg-[#f8f9fb]">
                          <td className="rounded-l-xl px-3 py-3 font-medium text-[#1d1d1d]">{zone.city_zone}</td>
                          <td className="px-3 py-3 text-[#3f4a5f]">{zone.cohort_size}</td>
                          <td className="px-3 py-3 text-[#3f4a5f]">
                            {zone.p25_net_pkr === null ? 'N/A' : formatCurrency(zone.p25_net_pkr)}
                          </td>
                          <td className="px-3 py-3 text-[#3f4a5f]">
                            {zone.median_net_pkr === null ? 'N/A' : formatCurrency(zone.median_net_pkr)}
                          </td>
                          <td className="px-3 py-3 text-[#3f4a5f]">
                            {zone.p75_net_pkr === null ? 'N/A' : formatCurrency(zone.p75_net_pkr)}
                          </td>
                          <td className="rounded-r-xl px-3 py-3">
                            <span
                              className={classNames(
                                'rounded-full px-2.5 py-1 text-xs font-medium',
                                zone.suppressed
                                  ? 'bg-slate-200 text-slate-700'
                                  : isAtRisk
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-emerald-100 text-emerald-700',
                              )}
                            >
                              {zone.suppressed
                                ? 'Suppressed'
                                : isAtRisk
                                  ? 'Potential Exploitation'
                                  : 'Stable'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {topLowIncomeZone ? (
                <p className="mt-4 rounded-xl border border-[#f4d6dc] bg-[#fff3f5] px-3 py-2 text-sm text-[#7c2d3a]">
                  Alert: {topLowIncomeZone.city_zone} is earning significantly below peer zones. Consider targeted advocacy or platform audit here.
                </p>
              ) : null}

              {!isIncomeLoading && zoneAggregates.length === 0 ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No income distribution data for current filters.
                </p>
              ) : null}

              {error ? (
                <button
                  type="button"
                  className="mt-4 rounded-xl border border-[#d6dce6] bg-white px-3 py-2 text-sm text-[#344054]"
                  onClick={() => {
                    clearError()
                    void fetchIncomeDistribution({
                      month: selectedMonth || undefined,
                      category: selectedCategory || undefined,
                    })
                  }}
                >
                  Retry Loading Distribution
                </button>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default IncomeDistributionMapPage
