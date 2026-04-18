import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/common/Icon'
import { LabeledTextField } from '../../components/common/LabeledTextField'
import { Sidebar } from '../../components/layout/Sidebar'
import { TopHeader } from '../../components/layout/TopHeader'
import { advocateSidebarItems } from '../../data/advocateData'
import { useAdvocateGrievanceApi } from '../../hooks/api/useAdvocateGrievanceApi'
import { useSidebarNavigation } from '../../hooks/useSidebarNavigation'
import { classNames, formatPercentage } from '../../utils/functions'

const platformColors = ['#2563eb', '#f97316', '#16a34a', '#be185d', '#7c3aed', '#0d9488']

const buildChartPoints = (
  values: number[],
  width: number,
  height: number,
  padding: number,
  min: number,
  max: number,
) => {
  const domain = max - min || 1

  return values.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1)
    const y = height - padding - ((value - min) / domain) * (height - padding * 2)
    return { x, y }
  })
}

const toLinePath = (points: Array<{ x: number; y: number }>) =>
  points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')

const ComplaintAnalyticsPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation()

  const {
    topCategories,
    complaintsByPlatform,
    escalationRatio,
    isAnalyticsLoading,
    error,
    fetchComplaintAnalytics,
    clearError,
  } = useAdvocateGrievanceApi()

  useEffect(() => {
    void fetchComplaintAnalytics({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    })
  }, [dateFrom, dateTo, fetchComplaintAnalytics])

  const categoryRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return topCategories
    }

    return topCategories.filter((item) => item.category.toLowerCase().includes(query))
  }, [searchQuery, topCategories])

  const maxCategoryCount = Math.max(...categoryRows.map((item) => item.count), 1)

  const visiblePlatforms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return complaintsByPlatform
    }

    return complaintsByPlatform.filter((item) => item.platform.toLowerCase().includes(query))
  }, [complaintsByPlatform, searchQuery])

  const timelineLabels = useMemo(() => {
    const labels = new Set<string>()

    visiblePlatforms.forEach((platform) => {
      platform.series.forEach((point) => {
        labels.add(point.date)
      })
    })

    return Array.from(labels).sort((first, second) => first.localeCompare(second))
  }, [visiblePlatforms])

  const trendSeries = useMemo(
    () =>
      visiblePlatforms.map((platform) => ({
        platform: platform.platform,
        total: platform.total,
        values: timelineLabels.map((label) => {
          const point = platform.series.find((item) => item.date === label)
          return point?.count ?? 0
        }),
      })),
    [timelineLabels, visiblePlatforms],
  )

  const allTrendValues = trendSeries.flatMap((series) => series.values)
  const minTrend = Math.max(Math.min(...allTrendValues, 0) - 3, 0)
  const maxTrend = Math.max(...allTrendValues, 1) + 3

  const highestComplaintPlatform = trendSeries.reduce(
    (top, current) => (current.total > top.total ? current : top),
    { platform: 'N/A', total: 0, values: [] as number[] },
  )

  const escalatedVsResolvedRatio =
    (escalationRatio?.escalated ?? 0) / Math.max(escalationRatio?.resolved ?? 0, 1)

  const totalHandled = (escalationRatio?.escalated ?? 0) + (escalationRatio?.resolved ?? 0)

  const width = 720
  const height = 260
  const padding = 28

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

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <LabeledTextField
                  label="Date From"
                  value={dateFrom}
                  onChange={setDateFrom}
                  type="date"
                />
                <LabeledTextField
                  label="Date To"
                  value={dateTo}
                  onChange={setDateTo}
                  type="date"
                />
              </div>

              {error ? (
                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
            </section>

            <section className="animate-fade-up grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_8px_25px_rgba(16,24,40,0.05)] xl:col-span-2">
                <p className="text-sm text-[#666f7f]">Escalated vs Resolved Ratio</p>
                <p className="mt-1 text-3xl font-bold text-[#1d1d1d]">{escalatedVsResolvedRatio.toFixed(2)}:1</p>
                <p className="mt-2 text-xs text-[#728097]">
                  {escalationRatio?.escalated ?? 0} escalated vs {escalationRatio?.resolved ?? 0} resolved complaints.
                </p>
                <div className="mt-4 h-2.5 rounded-full bg-[#e2e7ef]">
                  <div
                    className="h-2.5 rounded-full bg-(--color-button)"
                    style={{ width: `${totalHandled ? ((escalationRatio?.escalated ?? 0) / totalHandled) * 100 : 0}%` }}
                  />
                </div>
              </article>

              <article className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_8px_25px_rgba(16,24,40,0.05)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#666f7f]">Most Complained Platform</p>
                    <p className="mt-1 text-3xl font-bold text-[#1d1d1d]">{highestComplaintPlatform.platform}</p>
                    <p className="mt-2 text-xs text-[#728097]">{highestComplaintPlatform.total} complaints in range</p>
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
                    <p className="mt-1 text-3xl font-bold text-[#1d1d1d]">{escalationRatio?.open ?? 0}</p>
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
              <p className="mt-1 text-sm text-[#667085]">Bar chart of highest-volume complaint categories.</p>

              <div className="mt-4 space-y-3">
                {categoryRows.map((row) => {
                  const widthPercent = (row.count / maxCategoryCount) * 100

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
                  )
                })}
              </div>

              {!isAnalyticsLoading && categoryRows.length === 0 ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No complaint categories match your search.
                </p>
              ) : null}
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h3 className="text-lg font-semibold text-[#1d1d1d]">Complaint Volume Over Time per Platform</h3>
              <p className="mt-1 text-sm text-[#667085]">Daily complaint trend lines across platforms.</p>

              {isAnalyticsLoading ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  Loading complaint trend data...
                </p>
              ) : null}

              <div className="mt-5 overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full rounded-xl bg-[#f8f9fb] p-2">
                  {[0, 1, 2, 3].map((guide) => {
                    const y = padding + (guide * (height - padding * 2)) / 3
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
                    )
                  })}

                  {trendSeries.map((series, seriesIndex) => {
                    const color = platformColors[seriesIndex % platformColors.length]
                    const points = buildChartPoints(
                      series.values,
                      width,
                      height,
                      padding,
                      minTrend,
                      maxTrend,
                    )

                    return (
                      <g key={series.platform}>
                        <path d={toLinePath(points)} fill="none" stroke={color} strokeWidth="3" />
                        {points.map((point, pointIndex) => (
                          <circle
                            key={`${series.platform}-${timelineLabels[pointIndex]}`}
                            cx={point.x}
                            cy={point.y}
                            r="3.5"
                            fill="#fff"
                            stroke={color}
                            strokeWidth="2"
                          />
                        ))}
                      </g>
                    )
                  })}
                </svg>

                <div
                  className="mt-3 grid gap-2 text-xs text-[#667085]"
                  style={{ gridTemplateColumns: `repeat(${Math.max(timelineLabels.length, 1)}, minmax(0, 1fr))` }}
                >
                  {timelineLabels.map((point) => (
                    <span key={point} className="text-center">
                      {point}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#4b5565]">
                  {trendSeries.map((series, seriesIndex) => (
                    <span key={series.platform} className="inline-flex items-center gap-2">
                      <span
                        className={classNames('h-2.5 w-2.5 rounded-full')}
                        style={{ backgroundColor: platformColors[seriesIndex % platformColors.length] }}
                      />
                      {series.platform}
                    </span>
                  ))}
                </div>
              </div>

              {!isAnalyticsLoading && timelineLabels.length === 0 ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No complaint trend data returned for the selected range.
                </p>
              ) : null}
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h3 className="text-lg font-semibold text-[#1d1d1d]">Most Complained-About Platforms</h3>
              <p className="mt-1 text-sm text-[#667085]">Platform ranking by complaint count.</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {trendSeries
                  .slice()
                  .sort((first, second) => second.total - first.total)
                  .map((platform, index) => {
                    const total = trendSeries.reduce((sum, item) => sum + item.total, 0)
                    return (
                      <article key={platform.platform} className="rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                        <p className="text-xs text-[#667085]">Rank #{index + 1}</p>
                        <p className="mt-1 text-lg font-semibold text-[#1d1d1d]">{platform.platform}</p>
                        <p className="mt-2 text-sm text-[#4a5568]">{platform.total} complaints</p>
                        <p className="mt-1 text-xs text-[#728097]">
                          Share: {formatPercentage(total > 0 ? (platform.total / total) * 100 : 0)}
                        </p>
                      </article>
                    )
                  })}
              </div>

              {error ? (
                <button
                  type="button"
                  className="mt-4 rounded-xl border border-[#d6dce6] bg-white px-3 py-2 text-sm text-[#344054]"
                  onClick={() => {
                    clearError()
                    void fetchComplaintAnalytics({
                      date_from: dateFrom || undefined,
                      date_to: dateTo || undefined,
                    })
                  }}
                >
                  Retry Loading Complaint Analytics
                </button>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ComplaintAnalyticsPage
