import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/common/Button'
import { EarningsAiChatWidget } from '../../components/common/EarningsAiChatWidget'
import { LabeledSelectField } from '../../components/common/LabeledSelectField'
import { LabeledTextField } from '../../components/common/LabeledTextField'
import { ToastOnMessage } from '../../components/common/ToastOnMessage'
import { Sidebar } from '../../components/layout/Sidebar'
import { TopHeader } from '../../components/layout/TopHeader'
import { sidebarItems } from '../../data/dashboardData'
import { useWorkerAnalyticsApi } from '../../hooks/api/useWorkerAnalyticsApi'
import { useWorkerEarningsApi } from '../../hooks/api/useWorkerEarningsApi'
import { useWorkerProfileApi } from '../../hooks/api/useWorkerProfileApi'
import { useSidebarNavigation } from '../../hooks/useSidebarNavigation'
import { formatCurrency, formatPercentage } from '../../utils/functions'
import { anomalyApi } from '../../api/anomalyApi'
import type { WorkerShift } from '../../types/worker'
import type { ChatAnomalyFlag, ShiftSummary } from '../../types/anomaly'

type Timeframe = 'weekly' | 'monthly'

interface TrendRow {
  label: string
  gross: number
  net: number
  hours: number
}

const timeframeOptions = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

const defaultCategoryValues = [
  'ride_hailing',
  'food_delivery',
  'courier',
  'grocery_delivery',
  'multi_platform',
  'other',
]

const defaultCityZoneValues = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Peshawar',
  'Quetta',
  'Other',
]

const normalizeComparable = (value: string): string => value.trim().toLowerCase()

const buildSelectOptions = (
  values: Array<string | null | undefined>,
  placeholderLabel: string,
): Array<{ label: string; value: string }> => {
  const unique = new Map<string, string>()

  for (const raw of values) {
    const trimmed = raw?.trim()
    if (!trimmed) {
      continue
    }

    const normalized = normalizeComparable(trimmed)
    if (!unique.has(normalized)) {
      unique.set(normalized, trimmed)
    }
  }

  return [
    { label: placeholderLabel, value: '' },
    ...[...unique.values()]
      .sort((first, second) => first.localeCompare(second))
      .map((value) => ({ label: value, value })),
  ]
}

const toMonthLabel = (dateString: string): string => {
  const parsed = new Date(`${dateString}T00:00:00Z`)
  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}`
}

const startOfDayUtc = (value: Date): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))

const buildWeeklyTrend = (shifts: WorkerShift[]): TrendRow[] => {
  const today = startOfDayUtc(new Date())
  const start = new Date(today)
  start.setUTCDate(start.getUTCDate() - 6)

  const grouped = new Map<string, TrendRow>()

  for (const shift of shifts) {
    const shiftDate = new Date(`${shift.date}T00:00:00Z`)
    if (shiftDate < start || shiftDate > today) {
      continue
    }

    const label = shift.date
    const existing = grouped.get(label)

    if (existing) {
      existing.gross += shift.gross_earned
      existing.net += shift.net_received
      existing.hours += shift.hours_worked
    } else {
      grouped.set(label, {
        label,
        gross: shift.gross_earned,
        net: shift.net_received,
        hours: shift.hours_worked,
      })
    }
  }

  return [...grouped.values()].sort((first, second) => first.label.localeCompare(second.label))
}

const buildMonthlyTrend = (shifts: WorkerShift[]): TrendRow[] => {
  const grouped = new Map<string, TrendRow>()

  for (const shift of shifts) {
    const label = toMonthLabel(shift.date)
    const existing = grouped.get(label)

    if (existing) {
      existing.gross += shift.gross_earned
      existing.net += shift.net_received
      existing.hours += shift.hours_worked
    } else {
      grouped.set(label, {
        label,
        gross: shift.gross_earned,
        net: shift.net_received,
        hours: shift.hours_worked,
      })
    }
  }

  return [...grouped.values()]
    .sort((first, second) => first.label.localeCompare(second.label))
    .slice(-6)
}

const MyAnalyticsPage = () => {
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation()
  const [searchQuery, setSearchQuery] = useState('')
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly')
  const [medianCategory, setMedianCategory] = useState('')
  const [medianCityZone, setMedianCityZone] = useState('')
  const [medianMonth, setMedianMonth] = useState(() => {
    const now = new Date()
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  })
  const [localNotice, setLocalNotice] = useState<string | null>(null)
  const [chatAnomalies, setChatAnomalies] = useState<ChatAnomalyFlag[]>([])

  const {
    shifts,
    isLoading: isShiftsLoading,
    error: shiftsError,
    fetchShifts,
    clearError: clearShiftsError,
  } = useWorkerEarningsApi()

  const {
    workerMedian,
    isMedianLoading,
    error: analyticsError,
    fetchWorkerMedian,
    clearError,
  } = useWorkerAnalyticsApi()

  const { prefs } = useWorkerProfileApi()

  useEffect(() => {
    void fetchShifts({ page: 1, limit: 200 })
  }, [fetchShifts])

  useEffect(() => {
    if (prefs.primaryCategory && !medianCategory) {
      setMedianCategory(prefs.primaryCategory)
    }
    if (prefs.city && !medianCityZone) {
      setMedianCityZone(prefs.city)
    }
  }, [medianCategory, medianCityZone, prefs.city, prefs.primaryCategory])

  useEffect(() => {
    if (!medianCategory || !medianCityZone) {
      return
    }

    void fetchWorkerMedian(medianCategory, medianCityZone, medianMonth)
  }, [fetchWorkerMedian, medianCategory, medianCityZone, medianMonth])

  const trendData = useMemo(
    () => (timeframe === 'weekly' ? buildWeeklyTrend(shifts) : buildMonthlyTrend(shifts)),
    [shifts, timeframe],
  )

  const overallTotals = useMemo(() => {
    const gross = shifts.reduce((sum, shift) => sum + shift.gross_earned, 0)
    const net = shifts.reduce((sum, shift) => sum + shift.net_received, 0)
    const hours = shifts.reduce((sum, shift) => sum + shift.hours_worked, 0)

    return {
      gross,
      net,
      hours,
      hourlyRate: hours > 0 ? net / hours : 0,
      verifiedCount: shifts.filter((shift) => shift.verification_status === 'verified').length,
    }
  }, [shifts])

  const medianCategoryOptions = useMemo(
    () =>
      buildSelectOptions(
        [
          ...defaultCategoryValues,
          prefs.primaryCategory,
          ...shifts.map((shift) => shift.worker_category),
        ],
        'Select category',
      ),
    [prefs.primaryCategory, shifts],
  )

  const medianCityZoneOptions = useMemo(
    () =>
      buildSelectOptions(
        [
          ...defaultCityZoneValues,
          prefs.city,
          ...shifts.map((shift) => shift.city_zone),
        ],
        'Select city zone',
      ),
    [prefs.city, shifts],
  )

  const medianComparison = useMemo(() => {
    if (!workerMedian || workerMedian.median_net_earned_pkr === null) {
      return null
    }

    const selectedMonthNet = shifts
      .filter((shift) => toMonthLabel(shift.date) === medianMonth)
      .reduce((sum, shift) => sum + shift.net_received, 0)

    return {
      selectedMonthNet,
      cityMedian: workerMedian.median_net_earned_pkr,
      delta: selectedMonthNet - workerMedian.median_net_earned_pkr,
    }
  }, [medianMonth, shifts, workerMedian])

  const commissionByPlatform = useMemo(() => {
    const grouped = new Map<string, { gross: number; deductions: number; shifts: number }>()

    for (const shift of shifts) {
      if (shift.verification_status !== 'verified') {
        continue
      }

      const existing = grouped.get(shift.platform)
      if (existing) {
        existing.gross += shift.gross_earned
        existing.deductions += shift.deductions
        existing.shifts += 1
      } else {
        grouped.set(shift.platform, {
          gross: shift.gross_earned,
          deductions: shift.deductions,
          shifts: 1,
        })
      }
    }

    return [...grouped.entries()].map(([platform, value]) => ({
      platform,
      shifts: value.shifts,
      commissionRate: value.gross > 0 ? (value.deductions / value.gross) * 100 : 0,
      gross: value.gross,
      deductions: value.deductions,
    }))
  }, [shifts])

  const earningsSummary = useMemo<ShiftSummary>(() => {
    if (shifts.length === 0) {
      const nowIso = new Date().toISOString().slice(0, 10)
      return {
        total_shifts: 0,
        total_gross_pkr: 0,
        total_net_pkr: 0,
        avg_monthly_net_pkr: 0,
        platforms_worked: [],
        date_from: nowIso,
        date_to: nowIso,
      }
    }

    const totalGross = shifts.reduce((sum, shift) => sum + shift.gross_earned, 0)
    const totalNet = shifts.reduce((sum, shift) => sum + shift.net_received, 0)
    const platforms = Array.from(new Set(shifts.map((shift) => shift.platform))).sort((a, b) =>
      a.localeCompare(b),
    )
    const sortedDates = shifts.map((shift) => shift.date).sort((a, b) => a.localeCompare(b))
    const dateFrom = sortedDates[0] ?? new Date().toISOString().slice(0, 10)
    const dateTo = sortedDates.at(-1) ?? dateFrom

    const monthlyTotals = new Map<string, number>()
    for (const shift of shifts) {
      const month = shift.date.slice(0, 7)
      monthlyTotals.set(month, (monthlyTotals.get(month) ?? 0) + shift.net_received)
    }

    const avgMonthlyNet =
      monthlyTotals.size > 0
        ? Math.round(
            [...monthlyTotals.values()].reduce((sum, monthTotal) => sum + monthTotal, 0) /
              monthlyTotals.size,
          )
        : 0

    return {
      total_shifts: shifts.length,
      total_gross_pkr: totalGross,
      total_net_pkr: totalNet,
      avg_monthly_net_pkr: avgMonthlyNet,
      platforms_worked: platforms,
      date_from: dateFrom,
      date_to: dateTo,
    }
  }, [shifts])

  useEffect(() => {
    let isCancelled = false

    const loadAnomalies = async () => {
      if (shifts.length === 0) {
        setChatAnomalies([])
        return
      }

      try {
        const response = await anomalyApi.detect({
          worker_id: shifts[0]?.worker_id,
          shifts: shifts.slice(0, 30).map((shift) => ({
            shift_id: shift.id,
            date: shift.date,
            platform: shift.platform,
            hours_worked: shift.hours_worked,
            gross_earned: shift.gross_earned,
            platform_deductions: shift.deductions,
            net_received: shift.net_received,
          })),
        })

        if (!isCancelled) {
          setChatAnomalies(
            response.anomalies.map((anomaly) => ({
              date: anomaly.date,
              platform: anomaly.platform,
              anomaly_type: anomaly.anomaly_type,
              severity: anomaly.severity,
              explanation: anomaly.explanation,
            })),
          )
        }
      } catch {
        if (!isCancelled) {
          setChatAnomalies([])
        }
      }
    }

    void loadAnomalies()

    return () => {
      isCancelled = true
    }
  }, [shifts])

  const refreshAll = async () => {
    setLocalNotice(null)
    clearError()
    clearShiftsError()

    await fetchShifts({ page: 1, limit: 200 })

    if (medianCategory && medianCityZone) {
      await fetchWorkerMedian(medianCategory, medianCityZone, medianMonth)
    }
  }

  const loadMedian = async () => {
    setLocalNotice(null)
    clearError()
    clearShiftsError()

    if (!medianCategory || !medianCityZone) {
      setLocalNotice('Category and city zone are required for median comparison.')
      return
    }

    await fetchWorkerMedian(medianCategory, medianCityZone, medianMonth)
  }

  return (
    <div className="min-h-screen bg-[#eceef2] text-[#1d1d1d]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar
          items={sidebarItems}
          activeItemId={activeSidebarItem}
          onItemSelect={onSidebarItemSelect}
        />

        <main className="relative flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-(--color-button)/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#4a5d7d]/10 blur-3xl" />

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
            <TopHeader searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
            <ToastOnMessage message={shiftsError} tone="error" onShown={clearShiftsError} />
            <ToastOnMessage message={analyticsError} tone="error" onShown={clearError} />
            <ToastOnMessage message={localNotice} tone="warning" onShown={() => setLocalNotice(null)} />

            <section className="animate-fade-up grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_8px_25px_rgba(16,24,40,0.05)]">
                <p className="text-sm text-[#666f7f]">Total Net Earnings</p>
                <p className="mt-1 text-3xl font-bold text-[#1d1d1d]">{formatCurrency(overallTotals.net)}</p>
              </article>

              <article className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_8px_25px_rgba(16,24,40,0.05)]">
                <p className="text-sm text-[#666f7f]">Total Gross Earnings</p>
                <p className="mt-1 text-3xl font-bold text-[#1d1d1d]">{formatCurrency(overallTotals.gross)}</p>
              </article>

              <article className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_8px_25px_rgba(16,24,40,0.05)]">
                <p className="text-sm text-[#666f7f]">Effective Hourly Rate</p>
                <p className="mt-1 text-3xl font-bold text-[#1d1d1d]">{formatCurrency(overallTotals.hourlyRate)}</p>
              </article>

              <article className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_8px_25px_rgba(16,24,40,0.05)]">
                <p className="text-sm text-[#666f7f]">Verified Shifts</p>
                <p className="mt-1 text-3xl font-bold text-[#1d1d1d]">{overallTotals.verifiedCount}</p>
              </article>
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-5">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[#1d1d1d]">Earnings Trend</h3>
                  <p className="mt-1 text-sm text-[#667085]">Aggregated from real shift records.</p>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                  <LabeledSelectField
                    label="Timeframe"
                    options={timeframeOptions}
                    value={timeframe}
                    onChange={(value) => setTimeframe(value as Timeframe)}
                    containerClassName="w-full sm:w-40"
                  />
                  <Button variant="ghost" onClick={() => void refreshAll()} disabled={isShiftsLoading || isMedianLoading}>
                    {isShiftsLoading || isMedianLoading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-[#657083]">
                      <th className="px-3 py-2 font-medium">Period</th>
                      <th className="px-3 py-2 font-medium">Gross</th>
                      <th className="px-3 py-2 font-medium">Net</th>
                      <th className="px-3 py-2 font-medium">Hours</th>
                      <th className="px-3 py-2 font-medium">Hourly Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.map((item) => (
                      <tr key={item.label} className="rounded-xl bg-[#f8f9fb]">
                        <td className="rounded-l-xl px-3 py-3 font-medium text-[#1d1d1d]">{item.label}</td>
                        <td className="px-3 py-3 text-[#3f4a5f]">{formatCurrency(item.gross)}</td>
                        <td className="px-3 py-3 text-[#3f4a5f]">{formatCurrency(item.net)}</td>
                        <td className="px-3 py-3 text-[#3f4a5f]">{item.hours.toFixed(1)}</td>
                        <td className="rounded-r-xl px-3 py-3 font-medium text-[#1d1d1d]">
                          {formatCurrency(item.hours > 0 ? item.net / item.hours : 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!isShiftsLoading && trendData.length === 0 ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  Not enough shift data yet to plot trend rows.
                </p>
              ) : null}
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-5">
              <h3 className="mb-4 text-lg font-semibold text-[#1d1d1d]">Platform Commission Rate Tracker</h3>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-[#657083]">
                      <th className="px-3 py-2 font-medium">Platform</th>
                      <th className="px-3 py-2 font-medium">Verified Shifts</th>
                      <th className="px-3 py-2 font-medium">Gross</th>
                      <th className="px-3 py-2 font-medium">Deductions</th>
                      <th className="px-3 py-2 font-medium">Commission Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionByPlatform.map((item) => (
                      <tr key={item.platform} className="rounded-xl bg-[#f8f9fb]">
                        <td className="rounded-l-xl px-3 py-3 font-medium text-[#1d1d1d]">{item.platform}</td>
                        <td className="px-3 py-3 text-[#3f4a5f]">{item.shifts}</td>
                        <td className="px-3 py-3 text-[#3f4a5f]">{formatCurrency(item.gross)}</td>
                        <td className="px-3 py-3 text-[#3f4a5f]">{formatCurrency(item.deductions)}</td>
                        <td className="rounded-r-xl px-3 py-3 font-medium text-[#1d1d1d]">
                          {formatPercentage(item.commissionRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {commissionByPlatform.length === 0 ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No verified shifts available yet for commission analytics.
                </p>
              ) : null}
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-5">
              <h3 className="mb-4 text-lg font-semibold text-[#1d1d1d]">City-wide Median Comparison</h3>

              <div className="grid gap-3 md:grid-cols-4">
                <LabeledSelectField
                  label="Category"
                  options={medianCategoryOptions}
                  value={medianCategory}
                  onChange={setMedianCategory}
                />
                <LabeledSelectField
                  label="City Zone"
                  options={medianCityZoneOptions}
                  value={medianCityZone}
                  onChange={setMedianCityZone}
                />
                <LabeledTextField
                  label="Month"
                  type="month"
                  value={medianMonth}
                  onChange={setMedianMonth}
                />
                <div className="flex items-end">
                  <Button onClick={() => void loadMedian()} disabled={isMedianLoading}>
                    {isMedianLoading ? 'Loading...' : 'Load Median'}
                  </Button>
                </div>
              </div>

              {workerMedian ? (
                <div className="mt-4 rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                  <p className="text-sm text-[#475467]">
                    Cohort Size: <span className="font-semibold text-[#1d1d1d]">{workerMedian.cohort_size}</span>
                  </p>

                  {workerMedian.suppressed ? (
                    <p className="mt-2 text-sm text-[#b54708]">{workerMedian.message}</p>
                  ) : (
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-xs text-[#667085]">Your Net ({medianMonth})</p>
                        <p className="text-lg font-semibold text-[#1d1d1d]">
                          {formatCurrency(medianComparison?.selectedMonthNet ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#667085]">City Median</p>
                        <p className="text-lg font-semibold text-[#1d1d1d]">
                          {formatCurrency(workerMedian.median_net_earned_pkr ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#667085]">Difference</p>
                        <p className="text-lg font-semibold text-[#1d1d1d]">
                          {formatCurrency(medianComparison?.delta ?? 0)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          </div>
        </main>
      </div>
      <EarningsAiChatWidget earningsSummary={earningsSummary} anomalies={chatAnomalies} disabled={isShiftsLoading} />
    </div>
  )
}

export default MyAnalyticsPage
