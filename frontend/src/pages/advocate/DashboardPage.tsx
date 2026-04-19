import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/common/Icon'
import { ToastOnMessage } from '../../components/common/ToastOnMessage'
import { Sidebar } from '../../components/layout/Sidebar'
import { TopHeader } from '../../components/layout/TopHeader'
import { advocateSidebarItems } from '../../data/advocateData'
import { useAdvocateAnalyticsApi } from '../../hooks/api/useAdvocateAnalyticsApi'
import { useAdvocateGrievanceApi } from '../../hooks/api/useAdvocateGrievanceApi'
import { useSidebarNavigation } from '../../hooks/useSidebarNavigation'
import { classNames, formatCurrency } from '../../utils/functions'

interface AdvocateKpi {
  id: string
  label: string
  value: string
  icon: 'team' | 'wallet' | 'message' | 'chart'
  iconTint: string
  helperText: string
}

const formatCompactNumber = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

const getCurrentWeekRange = (): { dateFrom: string; dateTo: string } => {
  const now = new Date()
  const day = now.getUTCDay()
  const mondayOffset = (day + 6) % 7

  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - mondayOffset))
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 6)

  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
  }
}

const AdvocateDashboardPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation()

  const {
    overviewKpis,
    platformSummary,
    isOverviewLoading,
    isPlatformSummaryLoading,
    error: analyticsError,
    fetchOverviewKpis,
    fetchPlatformSummary,
    clearError: clearAnalyticsError,
  } = useAdvocateAnalyticsApi()

  const {
    complaintsByPlatform,
    isAnalyticsLoading,
    error: grievanceError,
    fetchComplaintsByPlatform,
    clearError: clearGrievanceError,
  } = useAdvocateGrievanceApi()

  useEffect(() => {
    const { dateFrom, dateTo } = getCurrentWeekRange()

    void fetchOverviewKpis()
    void fetchPlatformSummary({ date_from: dateFrom, date_to: dateTo })
    void fetchComplaintsByPlatform({ date_from: dateFrom, date_to: dateTo })
  }, [fetchComplaintsByPlatform, fetchOverviewKpis, fetchPlatformSummary])

  const complaintsByPlatformRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const base = complaintsByPlatform
      .map((item) => ({
        platform: item.platform,
        complaints: item.total,
      }))
      .sort((first, second) => second.complaints - first.complaints)

    if (!query) {
      return base
    }

    return base.filter((item) => item.platform.toLowerCase().includes(query))
  }, [complaintsByPlatform, searchQuery])

  const maxComplaints = Math.max(...complaintsByPlatformRows.map((item) => item.complaints), 1)

  const quickStats: AdvocateKpi[] = useMemo(() => {
    if (!overviewKpis) {
      return [
        {
          id: 'total-active-workers',
          label: 'Total Active Workers',
          value: '-',
          icon: 'team',
          iconTint: 'bg-blue-100 text-blue-600',
          helperText: 'Workers active in this period',
        },
        {
          id: 'verified-earnings-month',
          label: 'Total Verified Earnings (This Month)',
          value: '-',
          icon: 'wallet',
          iconTint: 'bg-emerald-100 text-emerald-700',
          helperText: 'Aggregated across verified submissions',
        },
        {
          id: 'grievances-this-week',
          label: 'Total Grievances Filed (This Week)',
          value: '-',
          icon: 'message',
          iconTint: 'bg-amber-100 text-amber-700',
          helperText: 'Synced from grievance analytics',
        },
        {
          id: 'top-platform-complaints',
          label: 'Top Platform by Complaint Volume',
          value: '-',
          icon: 'chart',
          iconTint: 'bg-rose-100 text-rose-700',
          helperText: 'Highest weekly complaint pressure',
        },
      ]
    }

    return [
      {
        id: 'total-active-workers',
        label: 'Total Active Workers',
        value: formatCompactNumber(overviewKpis.total_active_workers),
        icon: 'team',
        iconTint: 'bg-blue-100 text-blue-600',
        helperText: 'Workers active in this period',
      },
      {
        id: 'verified-earnings-month',
        label: 'Total Verified Earnings (This Month)',
        value: formatCurrency(overviewKpis.total_verified_earnings_this_month_pkr),
        icon: 'wallet',
        iconTint: 'bg-emerald-100 text-emerald-700',
        helperText: 'Aggregated across verified submissions',
      },
      {
        id: 'grievances-this-week',
        label: 'Total Grievances Filed (This Week)',
        value: formatCompactNumber(overviewKpis.total_grievances_this_week),
        icon: 'message',
        iconTint: 'bg-amber-100 text-amber-700',
        helperText: 'Synced from grievance analytics',
      },
      {
        id: 'top-platform-complaints',
        label: 'Top Platform by Complaint Volume',
        value: overviewKpis.most_complained_platform ?? 'N/A',
        icon: 'chart',
        iconTint: 'bg-rose-100 text-rose-700',
        helperText: 'Highest weekly complaint pressure',
      },
    ]
  }, [overviewKpis])

  const combinedError = analyticsError ?? grievanceError

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
            <ToastOnMessage message={combinedError} tone="error" />

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h2 className="text-2xl font-semibold text-[#1d1d1d]">Advocate Home</h2>
              <p className="mt-1 text-sm text-[#667085]">
                Live overview of worker activity, verified earnings, and grievance pressure points.
              </p>
            </section>

            <section className="animate-fade-up grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickStats.map((kpi, index) => (
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
                        'grid h-10 w-10 place-items-center rounded-xl',
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
                Weekly complaint volumes sourced from grievance analytics.
              </p>

              {(isAnalyticsLoading || isOverviewLoading) && complaintsByPlatformRows.length === 0 ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  Loading complaint volumes...
                </p>
              ) : null}

              <div className="mt-5 space-y-3">
                {complaintsByPlatformRows.map((item) => {
                  const widthPercent = (item.complaints / maxComplaints) * 100

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
                  )
                })}
              </div>

              {!isAnalyticsLoading && complaintsByPlatformRows.length === 0 ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No complaint volume data found for your current search.
                </p>
              ) : null}
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)]">
              <h3 className="text-lg font-semibold text-[#1d1d1d]">Verified Platform Summary (Current Week)</h3>
              <p className="mt-1 text-sm text-[#667085]">
                Earnings service aggregate view of verified shift outcomes by platform.
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-[#657083]">
                      <th className="px-3 py-2 font-medium">Platform</th>
                      <th className="px-3 py-2 font-medium">Total Workers</th>
                      <th className="px-3 py-2 font-medium">Total Shifts</th>
                      <th className="px-3 py-2 font-medium">Avg Net Earned</th>
                      <th className="px-3 py-2 font-medium">Avg Commission Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(platformSummary?.platforms ?? []).map((row) => (
                      <tr key={row.platform} className="rounded-xl bg-[#f8f9fb]">
                        <td className="rounded-l-xl px-3 py-3 font-medium text-[#1d1d1d]">{row.platform}</td>
                        <td className="px-3 py-3 text-[#3f4a5f]">{formatCompactNumber(row.total_workers)}</td>
                        <td className="px-3 py-3 text-[#3f4a5f]">{formatCompactNumber(row.total_shifts)}</td>
                        <td className="px-3 py-3 text-[#3f4a5f]">{formatCurrency(row.avg_net_earned_pkr)}</td>
                        <td className="rounded-r-xl px-3 py-3 text-[#3f4a5f]">{row.avg_commission_rate.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!isPlatformSummaryLoading && (platformSummary?.platforms.length ?? 0) === 0 ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No platform summary rows were returned for this week.
                </p>
              ) : null}

              {combinedError ? (
                <button
                  type="button"
                  className="mt-4 rounded-xl border border-[#d6dce6] bg-white px-3 py-2 text-sm text-[#344054]"
                  onClick={() => {
                    clearAnalyticsError()
                    clearGrievanceError()
                    const { dateFrom, dateTo } = getCurrentWeekRange()
                    void fetchOverviewKpis()
                    void fetchPlatformSummary({ date_from: dateFrom, date_to: dateTo })
                    void fetchComplaintsByPlatform({ date_from: dateFrom, date_to: dateTo })
                  }}
                >
                  Retry Loading Dashboard Data
                </button>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdvocateDashboardPage
