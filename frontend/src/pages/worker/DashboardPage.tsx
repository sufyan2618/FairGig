import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { Icon } from '../../components/common/Icon'
import { ToastOnMessage } from '../../components/common/ToastOnMessage'
import { Sidebar } from '../../components/layout/Sidebar'
import { TopHeader } from '../../components/layout/TopHeader'
import { sidebarItems } from '../../data/dashboardData'
import { useWorkerEarningsApi } from '../../hooks/api/useWorkerEarningsApi'
import { useWorkerGrievanceApi } from '../../hooks/api/useWorkerGrievanceApi'
import { useSidebarNavigation } from '../../hooks/useSidebarNavigation'
import { classNames, formatCurrency, formatHours } from '../../utils/functions'

const cardStyles = [
  'bg-blue-100 text-blue-600',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
] as const

const DashboardPage = () => {
  const navigate = useNavigate()
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation()
  const [searchQuery, setSearchQuery] = useState('')

  const {
    shifts,
    pagination,
    isLoading: isShiftsLoading,
    error: shiftsError,
    fetchShifts,
    clearError: clearShiftsError,
  } = useWorkerEarningsApi()

  const {
    complaints,
    error: complaintsError,
    fetchComplaints,
    clearError: clearComplaintsError,
  } = useWorkerGrievanceApi()

  useEffect(() => {
    void fetchShifts({ page: 1, limit: 50 })
    void fetchComplaints({ page: 1, limit: 20 })
  }, [fetchComplaints, fetchShifts])

  const now = new Date()
  const currentMonthLabel = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

  const verifiedThisMonth = useMemo(
    () =>
      shifts
        .filter(
          (shift) =>
            shift.verification_status === 'verified' && shift.date.startsWith(currentMonthLabel),
        )
        .reduce((sum, shift) => sum + shift.net_received, 0),
    [currentMonthLabel, shifts],
  )

  const pendingReviewCount = useMemo(
    () =>
      shifts.filter(
        (shift) =>
          shift.verification_status === 'pending' || shift.verification_status === 'pending_review',
      ).length,
    [shifts],
  )

  const openGrievancesCount = useMemo(
    () => complaints.filter((complaint) => complaint.escalation_status === 'open').length,
    [complaints],
  )

  const filteredRecentShifts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const sorted = [...shifts].sort(
      (first, second) =>
        new Date(second.submitted_at).getTime() - new Date(first.submitted_at).getTime(),
    )

    if (!q) {
      return sorted.slice(0, 8)
    }

    return sorted
      .filter(
        (shift) =>
          shift.platform.toLowerCase().includes(q) ||
          shift.date.includes(q) ||
          shift.verification_status.toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [searchQuery, shifts])

  const statusBadgeClass = (status: string): string => {
    if (status === 'verified') {
      return 'bg-emerald-100 text-emerald-700'
    }

    if (status === 'flagged' || status === 'unverifiable') {
      return 'bg-rose-100 text-rose-700'
    }

    return 'bg-amber-100 text-amber-700'
  }

  const dashboardCards = [
    {
      id: 'total-shifts',
      label: 'Total Shifts',
      value: String(pagination.total || shifts.length),
      icon: 'briefcase' as const,
    },
    {
      id: 'pending-review',
      label: 'Pending Review',
      value: String(pendingReviewCount),
      icon: 'clock' as const,
    },
    {
      id: 'verified-earnings',
      label: 'Verified This Month',
      value: formatCurrency(verifiedThisMonth),
      icon: 'wallet' as const,
    },
    {
      id: 'open-grievances',
      label: 'Open Grievances',
      value: String(openGrievancesCount),
      icon: 'message' as const,
    },
  ]

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
            <TopHeader
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />
            <ToastOnMessage message={shiftsError} tone="error" onShown={clearShiftsError} />
            <ToastOnMessage message={complaintsError} tone="error" onShown={clearComplaintsError} />

            <section className="animate-fade-up grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {dashboardCards.map((card, index) => (
                <article
                  key={card.id}
                  className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_8px_25px_rgba(16,24,40,0.05)]"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-[#666f7f]">{card.label}</p>
                      <p className="mt-1 text-3xl font-bold text-[#1d1d1d]">
                        {card.value}
                      </p>
                    </div>
                    <span
                      className={classNames(
                        'grid h-10 w-10 place-items-center rounded-xl',
                        cardStyles[index % cardStyles.length],
                      )}
                    >
                      <Icon name={card.icon} className="h-5 w-5" />
                    </span>
                  </div>
                </article>
              ))}
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-[#f7f8fa] p-4 md:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-[#1d1d1d]">Quick Actions</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={() => navigate('/dashboard/log-shift')}>
                    Log New Shift
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/dashboard/upload-screenshot')}>
                    Upload Screenshot
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/dashboard/income-certificate')}>
                    Generate Certificate
                  </Button>
                </div>
              </div>
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-[#1d1d1d]">Recent Shift Activity</h2>
                <Button
                  variant="ghost"
                  onClick={() => void fetchShifts({ page: 1, limit: 50 })}
                  disabled={isShiftsLoading}
                >
                  {isShiftsLoading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-[#657083]">
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Platform</th>
                      <th className="px-3 py-2 font-medium">Hours</th>
                      <th className="px-3 py-2 font-medium">Gross</th>
                      <th className="px-3 py-2 font-medium">Net</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecentShifts.map((shift) => (
                      <tr key={shift.id} className="rounded-xl bg-[#f8f9fb]">
                        <td className="rounded-l-xl px-3 py-3 font-medium text-[#1d1d1d]">{shift.date}</td>
                        <td className="px-3 py-3 text-[#3f4a5f]">{shift.platform}</td>
                        <td className="px-3 py-3 text-[#3f4a5f]">{formatHours(shift.hours_worked)}</td>
                        <td className="px-3 py-3 text-[#3f4a5f]">{formatCurrency(shift.gross_earned)}</td>
                        <td className="px-3 py-3 font-medium text-[#1d1d1d]">{formatCurrency(shift.net_received)}</td>
                        <td className="rounded-r-xl px-3 py-3">
                          <span className={classNames('rounded-full px-2.5 py-1 text-xs font-medium', statusBadgeClass(shift.verification_status))}>
                            {shift.verification_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!isShiftsLoading && filteredRecentShifts.length === 0 ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No shifts found for your current search.
                </p>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
