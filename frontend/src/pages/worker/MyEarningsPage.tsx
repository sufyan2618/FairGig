import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { LabeledSelectField } from '../../components/common/LabeledSelectField'
import { ToastOnMessage } from '../../components/common/ToastOnMessage'
import { Sidebar } from '../../components/layout/Sidebar'
import { TopHeader } from '../../components/layout/TopHeader'
import { sidebarItems } from '../../data/dashboardData'
import { useWorkerEarningsApi } from '../../hooks/api/useWorkerEarningsApi'
import { useSidebarNavigation } from '../../hooks/useSidebarNavigation'
import { classNames, formatCurrency, formatHours } from '../../utils/functions'
import type { ShiftVerificationStatus, WorkerShift } from '../../types/worker'

const statusFilterOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'Verified', value: 'verified' },
  { label: 'Flagged', value: 'flagged' },
  { label: 'Unverifiable', value: 'unverifiable' },
]

const getStatusBadgeClass = (status: ShiftVerificationStatus): string => {
  if (status === 'verified') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (status === 'flagged' || status === 'unverifiable') {
    return 'bg-rose-100 text-rose-700'
  }

  return 'bg-amber-100 text-amber-700'
}

const isShiftEditable = (status: ShiftVerificationStatus): boolean => status === 'pending'

const MyEarningsPage = () => {
  const navigate = useNavigate()
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [localNotice, setLocalNotice] = useState<string | null>(null)

  const {
    shifts,
    isLoading,
    isSubmitting,
    error,
    notice,
    screenshotCache,
    fetchShifts,
    updateShift,
    deleteShift,
    clearError,
    clearNotice,
  } = useWorkerEarningsApi()

  useEffect(() => {
    void fetchShifts({ page: 1, limit: 100 })
  }, [fetchShifts])

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return shifts
      .filter((entry) => {
        const matchesSearch =
          entry.platform.toLowerCase().includes(q) ||
          entry.date.includes(q) ||
          entry.verification_status.toLowerCase().includes(q)

        const matchesStatus =
          statusFilter === 'all' || entry.verification_status === statusFilter

        return matchesSearch && matchesStatus
      })
      .sort(
        (first, second) =>
          new Date(second.submitted_at).getTime() - new Date(first.submitted_at).getTime(),
      )
  }, [searchQuery, shifts, statusFilter])

  const toggleExpandedRow = (id: string): void => {
    setExpandedRowId((prev) => (prev === id ? null : id))
  }

  const handleQuickEdit = async (entry: WorkerShift): Promise<void> => {
    if (!isShiftEditable(entry.verification_status)) {
      setLocalNotice('Edit is allowed only for pending entries.')
      return
    }

    clearError()
    clearNotice()
    setLocalNotice(null)

    const grossInput = window.prompt('Update gross earned', String(entry.gross_earned))
    if (grossInput === null) {
      return
    }

    const deductionsInput = window.prompt('Update deductions', String(entry.deductions))
    if (deductionsInput === null) {
      return
    }

    const hoursInput = window.prompt('Update hours worked', String(entry.hours_worked))
    if (hoursInput === null) {
      return
    }

    const gross = Number.parseFloat(grossInput)
    const deductions = Number.parseFloat(deductionsInput)
    const hours = Number.parseFloat(hoursInput)

    if ([gross, deductions, hours].some((value) => Number.isNaN(value))) {
      setLocalNotice('Edit cancelled: values must be valid numbers.')
      return
    }

    if (hours <= 0 || hours >= 24) {
      setLocalNotice('Edit cancelled: hours must be greater than 0 and less than 24.')
      return
    }

    const net = gross - deductions
    if (net < 0) {
      setLocalNotice('Edit cancelled: net received cannot be negative.')
      return
    }

    try {
      await updateShift(entry.id, {
        platform: entry.platform,
        date: entry.date,
        hours_worked: hours,
        gross_earned: gross,
        deductions,
        net_received: net,
        worker_category: entry.worker_category,
        city_zone: entry.city_zone,
      })
    } catch {
      return
    }
  }

  const handleDelete = async (entry: WorkerShift): Promise<void> => {
    clearError()
    clearNotice()
    setLocalNotice(null)

    const shouldDelete = window.confirm('Delete this shift log? This action cannot be undone.')
    if (!shouldDelete) {
      return
    }

    try {
      await deleteShift(entry.id)
      if (expandedRowId === entry.id) {
        setExpandedRowId(null)
      }
    } catch {
      return
    }
  }

  const resolvedScreenshotUrl = (entry: WorkerShift): string | null => {
    return screenshotCache[entry.id] ?? entry.screenshot_url ?? null
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
            <ToastOnMessage message={error} tone="error" onShown={clearError} />
            <ToastOnMessage message={notice} tone="success" onShown={clearNotice} />
            <ToastOnMessage message={localNotice} tone="warning" onShown={() => setLocalNotice(null)} />

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-[#1d1d1d]">My Earnings</h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    All submitted shifts with real verification state and screenshot linkage.
                  </p>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                  <LabeledSelectField
                    label="Verification"
                    options={statusFilterOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    containerClassName="w-full sm:w-56"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => void fetchShifts({ page: 1, limit: 100 })}
                    disabled={isLoading || isSubmitting}
                  >
                    {isLoading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
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
                      <th className="px-3 py-2 font-medium">Verification</th>
                      <th className="px-3 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => {
                      const isExpanded = expandedRowId === entry.id
                      const canEdit = isShiftEditable(entry.verification_status)
                      const screenshotUrl = resolvedScreenshotUrl(entry)

                      return (
                        <Fragment key={entry.id}>
                          <tr className="rounded-xl bg-[#f8f9fb]">
                            <td className="rounded-l-xl px-3 py-3 font-medium text-[#1d1d1d]">{entry.date}</td>
                            <td className="px-3 py-3 text-[#3f4a5f]">{entry.platform}</td>
                            <td className="px-3 py-3 text-[#3f4a5f]">{formatHours(entry.hours_worked)}</td>
                            <td className="px-3 py-3 text-[#3f4a5f]">{formatCurrency(entry.gross_earned)}</td>
                            <td className="px-3 py-3 font-medium text-[#1d1d1d]">{formatCurrency(entry.net_received)}</td>
                            <td className="px-3 py-3">
                              <span
                                className={classNames(
                                  'rounded-full px-2.5 py-1 text-xs font-medium',
                                  getStatusBadgeClass(entry.verification_status),
                                )}
                              >
                                {entry.verification_status}
                              </span>
                            </td>
                            <td className="rounded-r-xl px-3 py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={() => toggleExpandedRow(entry.id)}>
                                  {isExpanded ? 'Hide' : 'View'}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => void handleQuickEdit(entry)}
                                  disabled={!canEdit || isSubmitting}
                                  className={classNames(!canEdit && 'cursor-not-allowed opacity-50')}
                                >
                                  Edit
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => void handleDelete(entry)}
                                  disabled={isSubmitting}
                                >
                                  Delete
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => navigate('/dashboard/upload-screenshot')}
                                >
                                  Upload Screenshot
                                </Button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded ? (
                            <tr>
                              <td colSpan={7} className="px-3 pb-4 pt-1">
                                <div className="rounded-xl border border-[#dde2ea] bg-white p-4">
                                  <p className="mb-3 text-sm font-medium text-[#344054]">Attached Screenshot</p>

                                  {screenshotUrl ? (
                                    <div className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-[#f7f8fa]">
                                      <img
                                        src={screenshotUrl}
                                        alt={`Shift screenshot for ${entry.platform} on ${entry.date}`}
                                        className="h-56 w-full object-cover md:h-72"
                                        loading="lazy"
                                      />
                                    </div>
                                  ) : (
                                    <p className="rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                                      No screenshot attached yet.
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {!isLoading && filteredEntries.length === 0 ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No earnings entries match your search and filter.
                </p>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default MyEarningsPage
