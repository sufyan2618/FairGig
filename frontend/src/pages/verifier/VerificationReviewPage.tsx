import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { Icon } from '../../components/common/Icon'
import { TopHeader } from '../../components/layout/TopHeader'
import { useVerifierVerificationApi } from '../../hooks/api/useVerifierVerificationApi'
import { useVerifierSidebarNavigation } from '../../hooks/useVerifierSidebarNavigation'
import { classNames, formatCurrency, formatHours } from '../../utils/functions'
import type { VerificationDecisionStatus } from '../../types/verifier'

const formatDateTime = (isoDateTime: string): string => {
  const date = new Date(isoDateTime)

  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatStatusLabel = (status: string): string =>
  status
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')

const VerificationReviewPage = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams<{ submissionId: string }>()
  const { sidebarItems, activeSidebarItem, onSidebarItemSelect } =
    useVerifierSidebarNavigation()
  const {
    selectedSubmission,
    isSubmissionLoading,
    isDecisionSubmitting,
    error,
    fetchSubmission,
    submitDecision,
    clearError,
  } = useVerifierVerificationApi()

  const [searchQuery, setSearchQuery] = useState('')
  const [note, setNote] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!submissionId) {
      return
    }

    void fetchSubmission(submissionId)
  }, [fetchSubmission, submissionId])

  const handleAction = async (actionType: VerificationDecisionStatus) => {
    if (!submissionId) {
      return
    }

    if (actionType === 'flagged' && !note.trim()) {
      setNotice('A note is required when flagging a case.')
      return
    }

    setNotice('')
    clearError()

    try {
      await submitDecision(submissionId, {
        status: actionType,
        note: note.trim() || undefined,
      })

      navigate('/verifier/verification-queue', {
        replace: true,
        state: {
          toast: {
            message: `Submission ${submissionId} marked as ${formatStatusLabel(actionType)}.`,
            tone: 'success',
          },
        },
      })
    } catch {
      return
    }
  }

  return (
    <div className="min-h-screen bg-[#eceef2] text-[#1d1d1d]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full bg-[#232429] text-white lg:min-h-screen lg:w-72">
          <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-[#141518] to-[#2f3239] ring-1 ring-white/10">
              <span className="text-lg font-bold text-(--color-button)">FG</span>
            </div>
            <div>
              <p className="text-sm font-semibold">FairGig</p>
              <p className="text-xs text-white/60">Verifier Console</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1 px-4 py-4">
            {sidebarItems.map((item) => {
              const isActive = item.id === activeSidebarItem;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSidebarItemSelect(item.id)}
                  className={classNames(
                    "group flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-(--color-button) text-white shadow-[0_8px_20px_rgba(255,145,77,0.3)]"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon
                    name={item.icon}
                    className={classNames("h-4 w-4", isActive ? "text-white" : "text-white/70")}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="relative flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-(--color-button)/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#4a5d7d]/10 blur-3xl" />

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
            <TopHeader
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-[#1d1d1d]">Verification Review</h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    Review a pending submission and record verifier decision.
                  </p>
                </div>
                <Button variant="ghost" onClick={() => navigate("/verifier/verification-queue")}>Back To Queue</Button>
              </div>

              {isSubmissionLoading ? (
                <div className="rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-4 py-3 text-sm text-[#425066]">
                  Loading submission details...
                </div>
              ) : null}

              {error ? (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              {selectedSubmission ? (
                <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                  <div className="rounded-2xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                    <h3 className="mb-3 text-base font-semibold text-[#1d1d1d]">Submission Snapshot</h3>
                    <div className="grid gap-2 text-sm text-[#445064]">
                      <p><span className="font-medium text-[#1d1d1d]">Worker:</span> {selectedSubmission.workerDisplayName}</p>
                      <p><span className="font-medium text-[#1d1d1d]">Platform:</span> {selectedSubmission.platform}</p>
                      <p><span className="font-medium text-[#1d1d1d]">Shift Date:</span> {selectedSubmission.shiftDate}</p>
                      <p><span className="font-medium text-[#1d1d1d]">Hours Worked:</span> {formatHours(selectedSubmission.hoursWorked)}</p>
                      <p><span className="font-medium text-[#1d1d1d]">Gross Earned:</span> {formatCurrency(selectedSubmission.grossEarned)}</p>
                      <p><span className="font-medium text-[#1d1d1d]">Deductions:</span> {formatCurrency(selectedSubmission.deductions)}</p>
                      <p><span className="font-medium text-[#1d1d1d]">Net Received:</span> {formatCurrency(selectedSubmission.netReceived)}</p>
                      <p><span className="font-medium text-[#1d1d1d]">Submitted At:</span> {formatDateTime(selectedSubmission.submittedAt)}</p>
                      <p>
                        <span className="font-medium text-[#1d1d1d]">Current Status:</span>{" "}
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          {formatStatusLabel(selectedSubmission.verificationStatus)}
                        </span>
                      </p>
                    </div>

                    <label className="mt-4 flex w-full flex-col gap-1">
                      <span className="text-xs font-medium text-[#5f6673]">Verifier Note</span>
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={5}
                        className="w-full rounded-xl border border-[#d9dde4] bg-white px-3 py-2.5 text-sm text-[#1d1d1d] outline-none placeholder:text-[#9aa3b2]"
                        placeholder="Add context or reason for decision"
                      />
                    </label>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        onClick={() => void handleAction('verified')}
                        disabled={isDecisionSubmitting}
                      >
                        {isDecisionSubmitting ? 'Submitting...' : 'Mark Verified'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => void handleAction('flagged')}
                        disabled={isDecisionSubmitting}
                      >
                        Flag Case
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => void handleAction('unverifiable')}
                        disabled={isDecisionSubmitting}
                      >
                        Mark Unverifiable
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                    <h3 className="mb-3 text-base font-semibold text-[#1d1d1d]">Screenshot</h3>
                    {selectedSubmission.screenshotUrl ? (
                      <img
                        src={selectedSubmission.screenshotUrl}
                        alt={`Submission ${selectedSubmission.id}`}
                        className="h-90 w-full rounded-xl border border-[#dce2ec] object-cover"
                      />
                    ) : (
                      <p className="rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                        Screenshot is not available for this submission.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-4 py-3 text-sm text-[#425066]">
                  Submission not found. Please return to queue and reopen the review.
                </div>
              )}

              {notice ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  {notice}
                </p>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default VerificationReviewPage
