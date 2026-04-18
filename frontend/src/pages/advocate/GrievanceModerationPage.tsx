import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/common/Button'
import { LabeledSelectField } from '../../components/common/LabeledSelectField'
import { Sidebar } from '../../components/layout/Sidebar'
import { TopHeader } from '../../components/layout/TopHeader'
import { advocateSidebarItems } from '../../data/advocateData'
import { useAdvocateGrievanceApi } from '../../hooks/api/useAdvocateGrievanceApi'
import { useSidebarNavigation } from '../../hooks/useSidebarNavigation'
import type { AdvocateComplaint, AdvocateEscalationStatus } from '../../types/advocate'
import { classNames } from '../../utils/functions'

const statusFilterOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Escalated', value: 'escalated' },
  { label: 'Resolved', value: 'resolved' },
]

const defaultTagTaxonomy = [
  'commission_hike',
  'wrongful_deactivation',
  'payment_delay',
  'app_bug',
  'safety_concern',
  'unfair_rating',
  'other',
]

const toLabel = (value: string): string =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const toClusterId = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const getStatusClass = (status: AdvocateEscalationStatus): string => {
  if (status === 'escalated') {
    return 'bg-amber-100 text-amber-700'
  }

  if (status === 'resolved') {
    return 'bg-emerald-100 text-emerald-700'
  }

  return 'bg-slate-200 text-slate-700'
}

const allowedTransitions: Record<AdvocateEscalationStatus, AdvocateEscalationStatus[]> = {
  open: ['escalated', 'resolved'],
  escalated: ['resolved'],
  resolved: ['open'],
}

const GrievanceModerationPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [clusterFilter, setClusterFilter] = useState('all')
  const [localNotice, setLocalNotice] = useState('')

  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation()

  const {
    complaints,
    clusters,
    isComplaintsLoading,
    isClustersLoading,
    isMutating,
    error,
    notice,
    fetchComplaints,
    fetchClusters,
    suggestClusters,
    updateTags,
    updateStatus,
    updateCluster,
    clearError,
    clearNotice,
  } = useAdvocateGrievanceApi()

  useEffect(() => {
    void fetchClusters()
  }, [fetchClusters])

  useEffect(() => {
    void fetchComplaints({
      page: 1,
      limit: 100,
      escalation_status:
        statusFilter === 'all' ? undefined : (statusFilter as AdvocateEscalationStatus),
      platform: platformFilter === 'all' ? undefined : platformFilter,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      tag: tagFilter === 'all' ? undefined : tagFilter,
      cluster_id: clusterFilter === 'all' ? undefined : clusterFilter,
    })
  }, [categoryFilter, clusterFilter, fetchComplaints, platformFilter, statusFilter, tagFilter])

  useEffect(() => {
    if (!notice) {
      return
    }

    const timeout = window.setTimeout(() => clearNotice(), 2600)
    return () => window.clearTimeout(timeout)
  }, [clearNotice, notice])

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return complaints
    }

    return complaints.filter((post) => {
      const text = `${post.platform} ${post.category} ${post.description} ${post.cluster_id ?? ''} ${post.tags.join(' ')}`
      return text.toLowerCase().includes(query)
    })
  }, [complaints, searchQuery])

  const platformOptions = useMemo(() => {
    const platforms = Array.from(new Set(complaints.map((item) => item.platform))).sort((a, b) =>
      a.localeCompare(b),
    )

    return [
      { label: 'All Platforms', value: 'all' },
      ...platforms.map((platform) => ({
        label: platform,
        value: platform,
      })),
    ]
  }, [complaints])

  const categoryOptions = useMemo(() => {
    const categories = Array.from(new Set(complaints.map((item) => item.category))).sort((a, b) =>
      a.localeCompare(b),
    )

    return [
      { label: 'All Categories', value: 'all' },
      ...categories.map((category) => ({
        label: toLabel(category),
        value: category,
      })),
    ]
  }, [complaints])

  const tagOptions = useMemo(() => {
    const tags = Array.from(
      new Set([...defaultTagTaxonomy, ...complaints.flatMap((item) => item.tags)]),
    ).sort((a, b) => a.localeCompare(b))

    return [
      { label: 'All Tags', value: 'all' },
      ...tags.map((tag) => ({
        label: toLabel(tag),
        value: tag,
      })),
    ]
  }, [complaints])

  const moderationTagOptions = useMemo(
    () =>
      tagOptions
        .filter((option) => option.value !== 'all')
        .map((option) => ({
          label: option.label,
          value: option.value,
        })),
    [tagOptions],
  )

  const clusterOptions = useMemo(
    () => [
      { label: 'All Clusters', value: 'all' },
      ...clusters.map((cluster) => ({
        label: cluster.cluster_label,
        value: cluster.cluster_id,
      })),
    ],
    [clusters],
  )

  const refreshModerationData = async (): Promise<void> => {
    await Promise.all([
      fetchComplaints({
        page: 1,
        limit: 100,
        escalation_status:
          statusFilter === 'all' ? undefined : (statusFilter as AdvocateEscalationStatus),
        platform: platformFilter === 'all' ? undefined : platformFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        tag: tagFilter === 'all' ? undefined : tagFilter,
        cluster_id: clusterFilter === 'all' ? undefined : clusterFilter,
      }),
      fetchClusters(),
    ])
  }

  const handleTagUpdate = async (postId: string, value: string) => {
    clearError()
    setLocalNotice('')

    try {
      await updateTags(postId, { tags: [value] })
    } catch {
      return
    }
  }

  const handleClusterSimilar = async (targetPost: AdvocateComplaint) => {
    clearError()
    setLocalNotice('')

    const candidateIds = complaints
      .filter(
        (post) =>
          post.platform === targetPost.platform && post.category === targetPost.category,
      )
      .map((post) => post.id)

    if (candidateIds.length < 2) {
      setLocalNotice('Need at least 2 similar complaints to run cluster suggestions.')
      return
    }

    let clusterLabel = `${toLabel(targetPost.platform)} ${toLabel(targetPost.category)}`
    let targetComplaintIds = candidateIds

    try {
      const suggestions = await suggestClusters(candidateIds)
      const matchedSuggestion =
        suggestions.find((item) => item.complaint_ids.includes(targetPost.id)) ?? suggestions[0]

      if (matchedSuggestion) {
        clusterLabel = matchedSuggestion.suggested_label
        targetComplaintIds = matchedSuggestion.complaint_ids
      }

      const clusterId = toClusterId(`${targetPost.platform}-${clusterLabel}`)

      await Promise.all(
        targetComplaintIds.map((complaintId) =>
          updateCluster(complaintId, {
            cluster_id: clusterId,
            cluster_label: clusterLabel,
          }),
        ),
      )

      await refreshModerationData()
      setLocalNotice(`Clustered ${targetComplaintIds.length} complaint(s) as "${clusterLabel}".`)
    } catch {
      return
    }
  }

  const handleStatusChange = async (
    postId: string,
    nextStatus: AdvocateEscalationStatus,
    moderationNote?: string,
  ) => {
    clearError()
    setLocalNotice('')

    try {
      await updateStatus(postId, {
        escalation_status: nextStatus,
        moderation_note: moderationNote,
      })
      await fetchClusters()
    } catch {
      return
    }
  }

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

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-6">
              <h2 className="text-2xl font-semibold text-[#1d1d1d]">Grievance Board (Moderation View)</h2>
              <p className="mt-1 text-sm text-[#667085]">
                Moderate worker grievances with tagging, clustering, escalation, and resolution controls.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <LabeledSelectField
                  label="Tag"
                  options={tagOptions}
                  value={tagFilter}
                  onChange={setTagFilter}
                />
                <LabeledSelectField
                  label="Platform"
                  options={platformOptions}
                  value={platformFilter}
                  onChange={setPlatformFilter}
                />
                <LabeledSelectField
                  label="Category"
                  options={categoryOptions}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                />
                <LabeledSelectField
                  label="Escalation Status"
                  options={statusFilterOptions}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
                <LabeledSelectField
                  label="Cluster"
                  options={clusterOptions}
                  value={clusterFilter}
                  onChange={setClusterFilter}
                />
              </div>

              {error ? (
                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              {notice ? (
                <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {notice}
                </p>
              ) : null}

              {localNotice ? (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  {localNotice}
                </p>
              ) : null}
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-5">
              <h3 className="mb-4 text-lg font-semibold text-[#1d1d1d]">Incoming Complaints</h3>

              {(isComplaintsLoading || isClustersLoading) && filteredPosts.length === 0 ? (
                <p className="mb-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  Loading complaints...
                </p>
              ) : null}

              <div className="grid gap-3">
                {filteredPosts.map((post) => {
                  const currentTag = post.tags[0] ?? moderationTagOptions[0]?.value ?? 'other'
                  const nextTransitions = allowedTransitions[post.escalation_status]

                  return (
                    <article key={post.id} className="rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#667085]">
                          <span className="rounded-full bg-white px-2.5 py-1 font-medium text-[#344054]">
                            {post.posted_by}
                          </span>
                          <span>{new Date(post.created_at).toLocaleDateString('en-US')}</span>
                          {post.cluster_id ? (
                            <span className="rounded-full bg-[#eef2f7] px-2.5 py-1 font-medium text-[#344054]">
                              Cluster: {post.cluster_id}
                            </span>
                          ) : null}
                        </div>

                        <span className={classNames('rounded-full px-2.5 py-1 text-xs font-medium', getStatusClass(post.escalation_status))}>
                          {toLabel(post.escalation_status)}
                        </span>
                      </div>

                      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#475467]">
                        <span className="rounded-full bg-[#eef2f7] px-2.5 py-1 font-medium">{post.platform}</span>
                        <span className="rounded-full bg-[#eef2f7] px-2.5 py-1 font-medium">{toLabel(post.category)}</span>
                        {post.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-[#dde7fb] px-2.5 py-1 font-medium text-[#2d4a7a]">
                            tag: {toLabel(tag)}
                          </span>
                        ))}
                      </div>

                      <p className="text-sm leading-6 text-[#344054]">{post.description}</p>

                      <div className="mt-4 grid gap-3 lg:grid-cols-[260px_1fr]">
                        <LabeledSelectField
                          label="Tag Complaint"
                          options={moderationTagOptions}
                          value={currentTag}
                          onChange={(value) => {
                            void handleTagUpdate(post.id, value)
                          }}
                        />

                        <div className="flex flex-wrap items-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              void handleClusterSimilar(post)
                            }}
                            disabled={isMutating}
                          >
                            Cluster Similar
                          </Button>

                          {nextTransitions.includes('escalated') ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                void handleStatusChange(post.id, 'escalated', 'Escalated by advocate moderation flow.')
                              }}
                              disabled={isMutating}
                            >
                              Mark as Escalated
                            </Button>
                          ) : null}

                          {nextTransitions.includes('resolved') ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                void handleStatusChange(post.id, 'resolved', 'Resolved after moderation review.')
                              }}
                              disabled={isMutating}
                            >
                              Mark as Resolved
                            </Button>
                          ) : null}

                          {nextTransitions.includes('open') ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                void handleStatusChange(post.id, 'open', 'Re-opened for further review.')
                              }}
                              disabled={isMutating}
                            >
                              Re-open
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {!isComplaintsLoading && filteredPosts.length === 0 ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No complaints match the active moderation filters.
                </p>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default GrievanceModerationPage
