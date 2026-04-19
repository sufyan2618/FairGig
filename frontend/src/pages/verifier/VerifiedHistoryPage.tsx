import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/common/Button'
import { Icon } from '../../components/common/Icon'
import { LabeledSelectField } from '../../components/common/LabeledSelectField'
import { LabeledTextField } from '../../components/common/LabeledTextField'
import { ToastOnMessage } from '../../components/common/ToastOnMessage'
import { TopHeader } from '../../components/layout/TopHeader'
import { useVerifierVerificationApi } from '../../hooks/api/useVerifierVerificationApi'
import { useVerifierSidebarNavigation } from '../../hooks/useVerifierSidebarNavigation'
import type { VerificationDecisionStatus } from '../../types/verifier'
import { classNames } from '../../utils/functions'
import logo from '../../assets/logo.jpeg'

const outcomeOptions = [
	{ label: 'All Outcomes', value: 'all' },
	{ label: 'Verified', value: 'verified' },
	{ label: 'Flagged', value: 'flagged' },
	{ label: 'Unverifiable', value: 'unverifiable' },
]

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

const outcomeClassMap: Record<VerificationDecisionStatus, string> = {
	verified: 'bg-emerald-100 text-emerald-700',
	flagged: 'bg-rose-100 text-rose-700',
	unverifiable: 'bg-slate-200 text-slate-700',
}

const formatOutcomeLabel = (outcome: VerificationDecisionStatus): string =>
	outcome.charAt(0).toUpperCase() + outcome.slice(1)

const VerifiedHistoryPage = () => {
	const { sidebarItems, activeSidebarItem, onSidebarItemSelect } =
		useVerifierSidebarNavigation()
	const {
		history,
		historyPagination,
		isHistoryLoading,
		error,
		fetchHistory,
		clearError,
	} = useVerifierVerificationApi()

	const [searchQuery, setSearchQuery] = useState('')
	const [startDate, setStartDate] = useState('')
	const [endDate, setEndDate] = useState('')
	const [outcomeFilter, setOutcomeFilter] = useState('all')

	useEffect(() => {
		void fetchHistory({
			page: 1,
			limit: 100,
			status:
				outcomeFilter === 'all' ? undefined : (outcomeFilter as VerificationDecisionStatus),
			dateFrom: startDate || undefined,
			dateTo: endDate || undefined,
		})
	}, [endDate, fetchHistory, outcomeFilter, startDate])

	const filteredRecords = useMemo(() => {
		const normalizedSearch = searchQuery.trim().toLowerCase();

		return history.filter((record) => {
			const matchesSearch =
				normalizedSearch.length === 0 ||
				`${record.workerDisplayName ?? ''} ${record.platform ?? ''} ${record.submissionId} ${record.decisionId}`
					.toLowerCase()
					.includes(normalizedSearch)

			return matchesSearch
		})
	}, [history, searchQuery])

	return (
		<div className="min-h-screen bg-[#eceef2] text-[#1d1d1d]">
			<div className="flex min-h-screen flex-col lg:flex-row">
				<aside className="w-full bg-[#232429] text-white lg:min-h-screen lg:w-72">
					<div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
						<div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-[#141518] to-[#2f3239] ring-1 ring-white/10">
							<img src={logo} alt="FairGig logo" className="h-full w-full object-cover scale-110" />
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
						<TopHeader searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
						<ToastOnMessage message={error} tone="error" onShown={clearError} />

						<section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-5">
							<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
								<div>
									<h2 className="text-xl font-semibold text-[#1d1d1d]">Verified History</h2>
									<p className="mt-1 text-sm text-[#667085]">
										Accountability log of submissions reviewed by this verifier.
									</p>
								</div>
								<span className="rounded-full bg-[#eef2f7] px-3 py-1 text-xs font-medium text-[#425066]">
									Records: {historyPagination.total}
								</span>
							</div>

							<div className="mb-4 grid gap-3 md:grid-cols-3">
								<LabeledTextField
									label="Start Date"
									type="date"
									value={startDate}
									onChange={setStartDate}
								/>
								<LabeledTextField
									label="End Date"
									type="date"
									value={endDate}
									onChange={setEndDate}
								/>
								<LabeledSelectField
									label="Outcome"
									options={outcomeOptions}
									value={outcomeFilter}
									onChange={setOutcomeFilter}
								/>
							</div>

							<div className="mb-3 flex justify-end">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										clearError()
										void fetchHistory({
											page: 1,
											limit: 100,
											status:
												outcomeFilter === 'all'
													? undefined
													: (outcomeFilter as VerificationDecisionStatus),
											dateFrom: startDate || undefined,
											dateTo: endDate || undefined,
										})
									}}
									disabled={isHistoryLoading}
								>
									{isHistoryLoading ? 'Refreshing...' : 'Refresh'}
								</Button>
							</div>

							<div className="overflow-x-auto">
								<table className="min-w-full border-separate border-spacing-y-2 text-sm">
									<thead>
										<tr className="text-left text-[#657083]">
											<th className="px-3 py-2 font-medium">Submission ID</th>
											<th className="px-3 py-2 font-medium">Worker ID</th>
											<th className="px-3 py-2 font-medium">Platform</th>
											<th className="px-3 py-2 font-medium">Shift Date</th>
											<th className="px-3 py-2 font-medium">Outcome</th>
											<th className="px-3 py-2 font-medium">Reviewed At</th>
										</tr>
									</thead>
									<tbody>
										{filteredRecords.map((record) => (
											<tr key={record.decisionId} className="rounded-xl bg-[#f8f9fb]">
												<td className="rounded-l-xl px-3 py-3 font-medium text-[#1d1d1d]">{record.submissionId}</td>
												<td className="px-3 py-3 text-[#3f4a5f]">{record.workerDisplayName ?? 'N/A'}</td>
												<td className="px-3 py-3 text-[#3f4a5f]">{record.platform ?? 'N/A'}</td>
												<td className="px-3 py-3 text-[#3f4a5f]">{record.shiftDate ?? 'N/A'}</td>
												<td className="px-3 py-3">
													<span
														className={classNames(
															"rounded-full px-2.5 py-1 text-xs font-medium",
															outcomeClassMap[record.outcome],
														)}
													>
														{formatOutcomeLabel(record.outcome)}
													</span>
												</td>
												<td className="rounded-r-xl px-3 py-3 text-[#3f4a5f]">
													{formatDateTime(record.reviewedAt)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{!isHistoryLoading && filteredRecords.length === 0 ? (
								<p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
									No verification history records match your current filters.
								</p>
							) : null}
						</section>
					</div>
				</main>
			</div>
		</div>
	)
}

export default VerifiedHistoryPage
