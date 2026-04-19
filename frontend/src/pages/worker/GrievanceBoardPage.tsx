import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '../../components/common/Button'
import { LabeledSelectField } from '../../components/common/LabeledSelectField'
import { ToastOnMessage } from '../../components/common/ToastOnMessage'
import { Sidebar } from '../../components/layout/Sidebar'
import { TopHeader } from '../../components/layout/TopHeader'
import { sidebarItems } from '../../data/dashboardData'
import { useWorkerGrievanceApi } from '../../hooks/api/useWorkerGrievanceApi'
import { useSidebarNavigation } from '../../hooks/useSidebarNavigation'
import { classNames } from '../../utils/functions'
import type { GrievanceComplaint, GrievanceStatus } from '../../types/worker'

const platformOptions = [
  { label: 'Select platform', value: '' },
  { label: 'Careem', value: 'Careem' },
  { label: 'foodpanda', value: 'foodpanda' },
  { label: 'Bykea', value: 'Bykea' },
  { label: 'Daraz', value: 'Daraz' },
  { label: 'Rozee', value: 'Rozee' },
  { label: 'Upwork', value: 'Upwork' },
  { label: 'Fiverr', value: 'Fiverr' },
  { label: 'Other', value: 'other' },
]

const categoryOptions = [
  { label: 'Select category', value: '' },
  { label: 'Commission Hike', value: 'commission_hike' },
  { label: 'Wrongful Deactivation', value: 'wrongful_deactivation' },
  { label: 'Payment Delay', value: 'payment_delay' },
  { label: 'App Bug', value: 'app_bug' },
  { label: 'Safety Concern', value: 'safety_concern' },
  { label: 'Unfair Rating', value: 'unfair_rating' },
  { label: 'Other', value: 'other' },
]

const statusFilterOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Escalated', value: 'escalated' },
  { label: 'Resolved', value: 'resolved' },
]

const getStatusClasses = (status: GrievanceStatus): string => {
  if (status === 'escalated') {
    return 'bg-amber-100 text-amber-700'
  }

  if (status === 'resolved') {
    return 'bg-emerald-100 text-emerald-700'
  }

  return 'bg-slate-200 text-slate-700'
}

const GrievanceBoardPage = () => {
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const [platform, setPlatform] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [localNotice, setLocalNotice] = useState<string | null>(null)
  const [pendingDeletePost, setPendingDeletePost] = useState<GrievanceComplaint | null>(null)

  const {
    complaints,
    isLoading,
    isSubmitting,
    error,
    notice,
    fetchComplaints,
    createComplaint,
    deleteComplaint,
    clearError,
    clearNotice,
  } = useWorkerGrievanceApi()

  useEffect(() => {
    void fetchComplaints({ page: 1, limit: 50 })
  }, [fetchComplaints])

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return complaints.filter((post) => {
      const matchesStatus = filterStatus === 'all' || post.escalation_status === filterStatus
      const matchesSearch =
        !q ||
        post.platform.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q) ||
        post.description.toLowerCase().includes(q)

      return matchesStatus && matchesSearch
    })
  }, [complaints, filterStatus, searchQuery])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    clearError()
    clearNotice()
    setLocalNotice(null)

    if (!platform || !category || !description.trim()) {
      setLocalNotice('Please complete platform, category, and description before posting.')
      return
    }

    if (description.trim().length < 20) {
      setLocalNotice('Description must be at least 20 characters long.')
      return
    }

    try {
      await createComplaint({
        platform,
        category,
        description: description.trim(),
      })
      setPlatform('')
      setCategory('')
      setDescription('')
    } catch {
      return
    }
  }

  const openDeleteModal = (post: GrievanceComplaint) => {
    clearError()
    clearNotice()
    setLocalNotice(null)

    if (!post.can_delete) {
      setLocalNotice('You can delete only your own open grievances.')
      return
    }

    setPendingDeletePost(post)
  }

  const closeDeleteModal = () => {
    if (isSubmitting) {
      return
    }

    setPendingDeletePost(null)
  }

  const handleDeleteConfirm = async () => {
    if (!pendingDeletePost) {
      return
    }

    try {
      await deleteComplaint(pendingDeletePost.id)
      setPendingDeletePost(null)
    } catch {
      return
    }
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

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-[#1d1d1d]">Grievance Board</h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    Post anonymized worker complaints and track moderation status updates.
                  </p>
                </div>
                <LabeledSelectField
                  label="Post Status"
                  options={statusFilterOptions}
                  value={filterStatus}
                  onChange={setFilterStatus}
                  containerClassName="w-full sm:w-48"
                />
              </div>

              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <LabeledSelectField
                  label="Platform"
                  options={platformOptions}
                  value={platform}
                  onChange={setPlatform}
                  required
                />
                <LabeledSelectField
                  label="Category"
                  options={categoryOptions}
                  value={category}
                  onChange={setCategory}
                  required
                />

                <label className="md:col-span-2 flex w-full flex-col gap-1">
                  <span className="text-xs font-medium text-[#5f6673]">Description</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-[#d9dde4] bg-white px-3 py-2.5 text-sm text-[#1d1d1d] outline-none placeholder:text-[#9aa3b2]"
                    placeholder="Describe the issue in detail. Your post will be anonymous."
                    required
                  />
                </label>

                <div className="md:col-span-2 mt-1 flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Posting...' : 'Post Anonymously'}
                  </Button>
                  <span className="text-xs font-medium text-[#667085]">
                    Identity is hidden. Only anonymous labels are visible.
                  </span>
                </div>
              </form>

            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-[#1d1d1d]">Community Posts</h3>
                <Button
                  variant="ghost"
                  onClick={() => void fetchComplaints({ page: 1, limit: 50 })}
                  disabled={isLoading || isSubmitting}
                >
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>

              <div className="grid gap-3">
                {filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#667085]">
                        <span className="rounded-full bg-white px-2.5 py-1 font-medium text-[#344054]">
                          {post.posted_by}
                        </span>
                        <span>{new Date(post.created_at).toISOString().slice(0, 10)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={classNames(
                            'rounded-full px-2.5 py-1 text-xs font-medium',
                            getStatusClasses(post.escalation_status),
                          )}
                        >
                          {post.escalation_status}
                        </span>
                        {post.can_delete ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isSubmitting}
                            onClick={() => openDeleteModal(post)}
                          >
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[#475467]">
                      <span className="rounded-full bg-[#eef2f7] px-2.5 py-1 font-medium">{post.platform}</span>
                      <span className="rounded-full bg-[#eef2f7] px-2.5 py-1 font-medium">{post.category}</span>
                    </div>

                    <p className="text-sm leading-6 text-[#344054]">{post.description}</p>
                  </article>
                ))}
              </div>

              {!isLoading && filteredPosts.length === 0 ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No posts match your filters.
                </p>
              ) : null}
            </section>
          </div>

          {pendingDeletePost ? (
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-[#101828]/45"
                onClick={closeDeleteModal}
                aria-label="Close delete confirmation"
              />

              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-grievance-title"
                className="relative z-10 w-full max-w-md rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_16px_40px_rgba(16,24,40,0.22)]"
              >
                <h4 id="delete-grievance-title" className="text-lg font-semibold text-[#1d1d1d]">
                  Delete this grievance post?
                </h4>
                <p className="mt-2 text-sm leading-6 text-[#475467]">
                  This action cannot be undone. The post will be permanently removed from the
                  community board.
                </p>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <Button variant="ghost" disabled={isSubmitting} onClick={closeDeleteModal}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-rose-600 text-white hover:bg-rose-700"
                    disabled={isSubmitting}
                    onClick={() => void handleDeleteConfirm()}
                  >
                    {isSubmitting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}

export default GrievanceBoardPage
