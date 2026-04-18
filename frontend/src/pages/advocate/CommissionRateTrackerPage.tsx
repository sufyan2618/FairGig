import { useEffect, useMemo, useState } from 'react'
import { LabeledSelectField } from '../../components/common/LabeledSelectField'
import { LabeledTextField } from '../../components/common/LabeledTextField'
import { Sidebar } from '../../components/layout/Sidebar'
import { TopHeader } from '../../components/layout/TopHeader'
import { advocateSidebarItems } from '../../data/advocateData'
import { useAdvocateAnalyticsApi } from '../../hooks/api/useAdvocateAnalyticsApi'
import { useSidebarNavigation } from '../../hooks/useSidebarNavigation'
import { classNames, formatPercentage } from '../../utils/functions'

const periodOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Weekly', value: 'weekly' },
]

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

const toAreaPath = (
  points: Array<{ x: number; y: number }>,
  height: number,
  padding: number,
) => {
  if (!points.length) {
    return ''
  }

  const baselineY = height - padding
  const linePath = toLinePath(points)
  const first = points[0]
  const last = points[points.length - 1]

  return `${linePath} L${last.x},${baselineY} L${first.x},${baselineY} Z`
}

const buildColorFromIndex = (index: number): { stroke: string; fill: string } => {
  const palette = [
    { stroke: '#f97316', fill: 'rgba(249,115,22,0.16)' },
    { stroke: '#2563eb', fill: 'rgba(37,99,235,0.14)' },
    { stroke: '#16a34a', fill: 'rgba(22,163,74,0.14)' },
    { stroke: '#be185d', fill: 'rgba(190,24,93,0.14)' },
    { stroke: '#7c3aed', fill: 'rgba(124,58,237,0.14)' },
    { stroke: '#0d9488', fill: 'rgba(13,148,136,0.14)' },
  ]

  return palette[index % palette.length]
}

const CommissionRateTrackerPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly'>('monthly')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation()

  const {
    commissionTrends,
    platforms,
    isCommissionLoading,
    isPlatformsLoading,
    error,
    fetchCommissionTrends,
    fetchPlatforms,
    clearError,
  } = useAdvocateAnalyticsApi()

  useEffect(() => {
    void fetchPlatforms()
  }, [fetchPlatforms])

  useEffect(() => {
    void fetchCommissionTrends({
      period: selectedPeriod,
      platform: selectedPlatform === 'all' ? undefined : selectedPlatform,
      date_from: startDate || undefined,
      date_to: endDate || undefined,
    })
  }, [endDate, fetchCommissionTrends, selectedPeriod, selectedPlatform, startDate])

  const platformOptions = useMemo(
    () => [
      { label: 'All Platforms', value: 'all' },
      ...platforms.map((platform) => ({
        label: platform,
        value: platform,
      })),
    ],
    [platforms],
  )

  const chartSeries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const rows = commissionTrends?.data ?? []

    if (!query) {
      return rows
    }

    return rows.filter((item) => item.platform.toLowerCase().includes(query))
  }, [commissionTrends?.data, searchQuery])

  const visibleLabels = useMemo(() => {
    const labels = new Set<string>()

    chartSeries.forEach((series) => {
      series.periods.forEach((period) => {
        labels.add(period.label)
      })
    })

    return Array.from(labels).sort((first, second) => first.localeCompare(second))
  }, [chartSeries])

  const normalizedSeries = useMemo(
    () =>
      chartSeries.map((series) => ({
        platform: series.platform,
        values: visibleLabels.map((label) => {
          const period = series.periods.find((item) => item.label === label)
          return period?.avg_commission_rate ?? 0
        }),
      })),
    [chartSeries, visibleLabels],
  )

  const allValues = normalizedSeries.flatMap((series) => series.values).filter((value) => value > 0)
  const minValue = allValues.length ? Math.min(...allValues) - 2 : 0
  const maxValue = allValues.length ? Math.max(...allValues) + 2 : 30

  const width = 760
  const height = 290
  const padding = 34

  const firstSeries = normalizedSeries[0]
  const firstFrom = firstSeries?.values[0]
  const firstTo = firstSeries?.values[firstSeries.values.length - 1]

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
                Track verified commission trends over time across platforms.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <LabeledSelectField
                  label="Period"
                  options={periodOptions}
                  value={selectedPeriod}
                  onChange={(value) => setSelectedPeriod(value as 'weekly' | 'monthly')}
                />
                <LabeledSelectField
                  label="Platform"
                  options={platformOptions}
                  value={selectedPlatform}
                  onChange={setSelectedPlatform}
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

              {error ? (
                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h3 className="text-lg font-semibold text-[#1d1d1d]">Commission Trend (Line/Area)</h3>
              <p className="mt-1 text-sm text-[#667085]">
                Example insight:
                {' '}
                {firstSeries?.platform ?? 'Selected platform'} moved from
                {' '}
                <span className="font-semibold text-[#1d1d1d]">
                  {firstFrom !== undefined ? formatPercentage(firstFrom) : '-'}
                </span>
                {' '}
                to
                {' '}
                <span className="font-semibold text-[#1d1d1d]">
                  {firstTo !== undefined ? formatPercentage(firstTo) : '-'}
                </span>
                {' '}
                in the current range.
              </p>

              {isCommissionLoading || isPlatformsLoading ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  Loading commission trend data...
                </p>
              ) : null}

              <div className="mt-5 overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full rounded-xl bg-[#f8f9fb] p-2">
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

                  {normalizedSeries.map((series, index) => {
                    const points = buildChartPoints(
                      series.values,
                      width,
                      height,
                      padding,
                      minValue,
                      maxValue,
                    )
                    const color = buildColorFromIndex(index)

                    if (points.every((point) => point.y === height - padding)) {
                      return null
                    }

                    return (
                      <g key={series.platform}>
                        <path d={toAreaPath(points, height, padding)} fill={color.fill} />
                        <path d={toLinePath(points)} fill="none" stroke={color.stroke} strokeWidth="3" />
                        {points.map((point, pointIndex) => (
                          <circle
                            key={`${series.platform}-${visibleLabels[pointIndex]}`}
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill="#ffffff"
                            stroke={color.stroke}
                            strokeWidth="2"
                          />
                        ))}
                      </g>
                    )
                  })}
                </svg>

                <div className="mt-3 grid gap-2 text-xs text-[#667085]" style={{ gridTemplateColumns: `repeat(${Math.max(visibleLabels.length, 1)}, minmax(0, 1fr))` }}>
                  {visibleLabels.map((label) => (
                    <span key={label} className="text-center">
                      {label}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#4b5565]">
                  {normalizedSeries.map((series, index) => (
                    <span key={series.platform} className="inline-flex items-center gap-2">
                      <span
                        className={classNames('h-2.5 w-2.5 rounded-full')}
                        style={{ backgroundColor: buildColorFromIndex(index).stroke }}
                      />
                      {series.platform}
                    </span>
                  ))}
                </div>
              </div>

              {!isCommissionLoading && visibleLabels.length === 0 ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No commission trend data in selected filters.
                </p>
              ) : null}

              {error ? (
                <button
                  type="button"
                  className="mt-4 rounded-xl border border-[#d6dce6] bg-white px-3 py-2 text-sm text-[#344054]"
                  onClick={() => {
                    clearError()
                    void fetchCommissionTrends({
                      period: selectedPeriod,
                      platform: selectedPlatform === 'all' ? undefined : selectedPlatform,
                      date_from: startDate || undefined,
                      date_to: endDate || undefined,
                    })
                  }}
                >
                  Retry Loading Trends
                </button>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default CommissionRateTrackerPage
