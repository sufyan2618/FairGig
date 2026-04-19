import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Button } from '../../components/common/Button'
import { LabeledSelectField } from '../../components/common/LabeledSelectField'
import { ToastOnMessage } from '../../components/common/ToastOnMessage'
import { Sidebar } from '../../components/layout/Sidebar'
import { TopHeader } from '../../components/layout/TopHeader'
import { sidebarItems } from '../../data/dashboardData'
import { useWorkerEarningsApi } from '../../hooks/api/useWorkerEarningsApi'
import { useSidebarNavigation } from '../../hooks/useSidebarNavigation'
import { classNames } from '../../utils/functions'
import type { ShiftVerificationStatus } from '../../types/worker'

const getStatusBadgeClass = (status: ShiftVerificationStatus): string => {
  if (status === 'verified') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (status === 'flagged' || status === 'unverifiable') {
    return 'bg-rose-100 text-rose-700'
  }

  return 'bg-amber-100 text-amber-700'
}

const UploadScreenshotPage = () => {
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedShiftId, setSelectedShiftId] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [localNotice, setLocalNotice] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const {
    shifts,
    isLoading,
    isSubmitting,
    error,
    notice,
    screenshotCache,
    fetchShifts,
    uploadShiftScreenshot,
    clearError,
    clearNotice,
  } = useWorkerEarningsApi()

  useEffect(() => {
    void fetchShifts({ page: 1, limit: 100 })
  }, [fetchShifts])

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedFile])

  const shiftOptions = useMemo(
    () => [
      { label: 'Select shift log', value: '' },
      ...shifts.map((shift) => ({
        label: `${shift.date} - ${shift.platform} (${shift.verification_status})`,
        value: shift.id,
      })),
    ],
    [shifts],
  )

  const selectedShift = useMemo(
    () => shifts.find((shift) => shift.id === selectedShiftId) ?? null,
    [selectedShiftId, shifts],
  )

  const resolvedScreenshotUrl = selectedShift
    ? screenshotCache[selectedShift.id] ?? selectedShift.screenshot_url
    : null

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    clearError()
    setLocalNotice(file ? `Selected file: ${file.name}` : null)
  }

  const submitUpload = async () => {
    clearError()
    clearNotice()
    setLocalNotice(null)

    if (!selectedShiftId) {
      setLocalNotice('Choose a shift first.')
      return
    }

    if (!selectedFile) {
      setLocalNotice('Select a screenshot file before upload.')
      return
    }

    try {
      await uploadShiftScreenshot(selectedShiftId, selectedFile)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      await fetchShifts({ page: 1, limit: 100 })
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
            <ToastOnMessage message={localNotice} tone="info" onShown={() => setLocalNotice(null)} />

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-[#1d1d1d]">Upload Screenshot</h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    Attach screenshot evidence to an existing shift so verifier review can start.
                  </p>
                </div>
                <span className="rounded-full bg-[#eef2f7] px-3 py-1 text-xs font-medium text-[#425066]">
                  JPG, PNG or WEBP
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <LabeledSelectField
                  label="Shift Log"
                  options={shiftOptions}
                  value={selectedShiftId}
                  onChange={setSelectedShiftId}
                  disabled={isLoading || isSubmitting}
                />

                <div className="flex w-full flex-col gap-1">
                  <span className="text-xs font-medium text-[#5f6673]">Screenshot File</span>
                  <div className="flex h-11 items-center gap-2 rounded-xl border border-[#d9dde4] bg-white px-3">
                    <span className="truncate text-sm text-[#1d1d1d]">
                      {selectedFile ? selectedFile.name : 'No file selected'}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleFileSelection}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button type="button" onClick={() => void submitUpload()} disabled={isSubmitting || isLoading}>
                  {isSubmitting ? 'Uploading...' : 'Submit Screenshot'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                    setLocalNotice(null)
                    clearNotice()
                  }}
                  disabled={isSubmitting}
                >
                  Reset
                </Button>
              </div>

              {selectedShift ? (
                <div className="mt-5 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] p-4">
                  <p className="text-sm text-[#425066]">
                    Linked Shift: <span className="font-medium text-[#1d1d1d]">{selectedShift.platform}</span> on {selectedShift.date}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-[#425066]">Current Verification Status:</span>
                    <span
                      className={classNames(
                        'rounded-full px-2.5 py-1 text-xs font-medium',
                        getStatusBadgeClass(selectedShift.verification_status),
                      )}
                    >
                      {selectedShift.verification_status}
                    </span>
                  </div>
                </div>
              ) : null}

              {previewUrl ? (
                <div className="mt-5 overflow-hidden rounded-xl border border-[#e4e7ec] bg-[#f7f8fa]">
                  <p className="border-b border-[#e4e7ec] bg-white px-4 py-2 text-sm font-medium text-[#1d1d1d]">
                    New screenshot preview
                  </p>
                  <img src={previewUrl} alt="New screenshot preview" className="h-64 w-full object-cover" />
                </div>
              ) : null}

              {resolvedScreenshotUrl ? (
                <div className="mt-5 overflow-hidden rounded-xl border border-[#e4e7ec] bg-[#f7f8fa]">
                  <p className="border-b border-[#e4e7ec] bg-white px-4 py-2 text-sm font-medium text-[#1d1d1d]">
                    Existing attached screenshot
                  </p>
                  <img
                    src={resolvedScreenshotUrl}
                    alt="Existing attached screenshot"
                    className="h-64 w-full object-cover"
                  />
                </div>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default UploadScreenshotPage
