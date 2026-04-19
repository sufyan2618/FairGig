import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Button } from '../../components/common/Button'
import { LabeledSelectField } from '../../components/common/LabeledSelectField'
import { LabeledTextField } from '../../components/common/LabeledTextField'
import { ToastOnMessage } from '../../components/common/ToastOnMessage'
import { Sidebar } from '../../components/layout/Sidebar'
import { TopHeader } from '../../components/layout/TopHeader'
import { sidebarItems } from '../../data/dashboardData'
import { useWorkerEarningsApi } from '../../hooks/api/useWorkerEarningsApi'
import { useWorkerProfileApi } from '../../hooks/api/useWorkerProfileApi'
import { useSidebarNavigation } from '../../hooks/useSidebarNavigation'
import type { CreateShiftPayload } from '../../types/worker'

interface ShiftFormData {
  platform: string
  date: string
  hours_worked: string
  gross_earned: string
  deductions: string
  net_received: string
  worker_category: string
  city_zone: string
}

const platformOptions = [
  { label: 'Select platform', value: '' },
  { label: 'Careem', value: 'Careem' },
  { label: 'foodpanda', value: 'foodpanda' },
  { label: 'Bykea', value: 'Bykea' },
  { label: 'InDrive', value: 'InDrive' },
  { label: 'Yango', value: 'Yango' },
  { label: 'Daraz', value: 'Daraz' },
  { label: 'Other', value: 'other' },
]

const workerCategoryOptions = [
  { label: 'Select category', value: '' },
  { label: 'ride_hailing', value: 'ride_hailing' },
  { label: 'food_delivery', value: 'food_delivery' },
  { label: 'courier', value: 'courier' },
  { label: 'other', value: 'other' },
]

const initialFormData: ShiftFormData = {
  platform: '',
  date: '',
  hours_worked: '',
  gross_earned: '',
  deductions: '',
  net_received: '',
  worker_category: '',
  city_zone: '',
}

const toNumber = (value: string): number => Number.parseFloat(value)

const LogShiftPage = () => {
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation()
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState<ShiftFormData>(initialFormData)
  const [manualNotice, setManualNotice] = useState<string | null>(null)
  const [csvFileName, setCsvFileName] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)

  const {
    isSubmitting,
    error,
    notice,
    lastImportSummary,
    createShift,
    importShiftsCsv,
    downloadImportTemplate,
    fetchShifts,
    clearError,
    clearNotice,
  } = useWorkerEarningsApi()

  const { prefs } = useWorkerProfileApi()

  const csvInputRef = useRef<HTMLInputElement | null>(null)
  const screenshotInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (prefs.city || prefs.primaryCategory) {
      setFormData((prev) => ({
        ...prev,
        city_zone: prev.city_zone || prefs.city,
        worker_category: prev.worker_category || prefs.primaryCategory,
      }))
    }
  }, [prefs.city, prefs.primaryCategory])

  useEffect(() => {
    void fetchShifts({ page: 1, limit: 20 })
  }, [fetchShifts])

  const updateField = (key: keyof ShiftFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const validateForm = (): string | null => {
    if (!formData.platform || !formData.date) {
      return 'Platform and date are required.'
    }

    const hoursWorked = toNumber(formData.hours_worked)
    const grossEarned = toNumber(formData.gross_earned)
    const deductions = toNumber(formData.deductions)
    const netReceived = toNumber(formData.net_received)

    if ([hoursWorked, grossEarned, deductions, netReceived].some((value) => Number.isNaN(value))) {
      return 'Hours, gross, deductions, and net values must be valid numbers.'
    }

    if (hoursWorked <= 0 || hoursWorked >= 24) {
      return 'Hours worked must be greater than 0 and less than 24.'
    }

    if (grossEarned <= 0 || deductions < 0 || netReceived < 0) {
      return 'Gross must be positive and deductions/net cannot be negative.'
    }

    if (Math.abs(netReceived - (grossEarned - deductions)) > 5) {
      return 'Net received should roughly match gross - deductions.'
    }

    return null
  }

  const buildPayload = (): CreateShiftPayload => ({
    platform: formData.platform,
    date: formData.date,
    hours_worked: toNumber(formData.hours_worked),
    gross_earned: toNumber(formData.gross_earned),
    deductions: toNumber(formData.deductions),
    net_received: toNumber(formData.net_received),
    worker_category: formData.worker_category.trim() || null,
    city_zone: formData.city_zone.trim() || null,
  })

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()
    clearNotice()
    setManualNotice(null)

    const validationError = validateForm()
    if (validationError) {
      setManualNotice(validationError)
      return
    }

    try {
      await createShift(buildPayload(), screenshotFile)
      setFormData((prev) => ({
        ...initialFormData,
        city_zone: prev.city_zone,
        worker_category: prev.worker_category,
      }))
      setScreenshotFile(null)
      if (screenshotInputRef.current) {
        screenshotInputRef.current.value = ''
      }
    } catch {
      return
    }
  }

  const handleCsvPick = () => {
    csvInputRef.current?.click()
  }

  const handleCsvUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    clearError()
    clearNotice()
    setManualNotice(null)

    try {
      setCsvFileName(file.name)
      await importShiftsCsv(file)
    } catch {
      return
    } finally {
      if (csvInputRef.current) {
        csvInputRef.current.value = ''
      }
    }
  }

  const handleTemplateDownload = async () => {
    clearError()
    setManualNotice(null)

    try {
      const blob = await downloadImportTemplate()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'shift_import_template.csv'
      link.click()
      window.URL.revokeObjectURL(url)
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
            <ToastOnMessage message={manualNotice} tone="warning" onShown={() => setManualNotice(null)} />
            <ToastOnMessage message={error} tone="error" onShown={clearError} />
            <ToastOnMessage message={notice} tone="success" onShown={clearNotice} />

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-[#1d1d1d]">Log a Shift</h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    Submit earnings records to the backend and optionally attach a screenshot in the same flow.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={handleTemplateDownload} disabled={isSubmitting}>
                    Download CSV Template
                  </Button>
                  <Button variant="ghost" onClick={handleCsvPick} disabled={isSubmitting}>
                    Bulk Import CSV
                  </Button>
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleCsvUpload}
                  />
                </div>
              </div>

              <p className="mb-4 text-xs text-[#667085]">
                CSV date accepted: YYYY-MM-DD (recommended), DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY, DD-MM-YY.
                Examples: 2026-12-22, 22/12/2026, 22-3-26.
              </p>

              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleManualSubmit}>
                <LabeledSelectField
                  label="Platform"
                  options={platformOptions}
                  value={formData.platform}
                  onChange={(value) => updateField('platform', value)}
                  required
                />
                <LabeledTextField
                  label="Date"
                  value={formData.date}
                  onChange={(value) => updateField('date', value)}
                  type="date"
                  required
                />

                <LabeledTextField
                  label="Hours Worked"
                  value={formData.hours_worked}
                  onChange={(value) => updateField('hours_worked', value)}
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g. 8"
                  required
                />
                <LabeledTextField
                  label="Gross Earned"
                  value={formData.gross_earned}
                  onChange={(value) => updateField('gross_earned', value)}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 4500"
                  required
                />

                <LabeledTextField
                  label="Platform Deductions"
                  value={formData.deductions}
                  onChange={(value) => updateField('deductions', value)}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 500"
                  required
                />
                <LabeledTextField
                  label="Net Received"
                  value={formData.net_received}
                  onChange={(value) => updateField('net_received', value)}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 4000"
                  required
                />

                <LabeledSelectField
                  label="Worker Category"
                  options={workerCategoryOptions}
                  value={formData.worker_category}
                  onChange={(value) => updateField('worker_category', value)}
                />
                <LabeledTextField
                  label="City Zone"
                  value={formData.city_zone}
                  onChange={(value) => updateField('city_zone', value)}
                  placeholder="e.g. lahore-east"
                />

                <div className="md:col-span-2 flex w-full flex-col gap-1">
                  <span className="text-xs font-medium text-[#5f6673]">Optional Screenshot</span>
                  <div className="flex h-11 items-center gap-2 rounded-xl border border-[#d9dde4] bg-white px-3">
                    <span className="truncate text-sm text-[#1d1d1d]">
                      {screenshotFile ? screenshotFile.name : 'No screenshot selected'}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      onClick={() => screenshotInputRef.current?.click()}
                    >
                      Choose Screenshot
                    </Button>
                    <input
                      ref={screenshotInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => setScreenshotFile(event.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 mt-2 flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Shift'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSubmitting}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...initialFormData,
                        city_zone: prev.city_zone,
                        worker_category: prev.worker_category,
                      }))
                      setScreenshotFile(null)
                      setManualNotice(null)
                    }}
                  >
                    Reset Form
                  </Button>
                </div>
              </form>

              {csvFileName ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  Last CSV file processed: {csvFileName}
                </p>
              ) : null}

              {lastImportSummary ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  Import summary: {lastImportSummary.imported} imported, {lastImportSummary.failed} failed, {lastImportSummary.total_rows} total rows.
                </p>
              ) : null}

            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default LogShiftPage
