import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/common/Button'
import { LabeledTextField } from '../../components/common/LabeledTextField'
import { ToastOnMessage } from '../../components/common/ToastOnMessage'
import { Sidebar } from '../../components/layout/Sidebar'
import { TopHeader } from '../../components/layout/TopHeader'
import { sidebarItems } from '../../data/dashboardData'
import { useWorkerCertificateApi } from '../../hooks/api/useWorkerCertificateApi'
import { useSidebarNavigation } from '../../hooks/useSidebarNavigation'

const IncomeCertificatePage = () => {
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation()
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [localNotice, setLocalNotice] = useState<string | null>(null)

  const {
    html,
    isLoading,
    error,
    lastRange,
    generateCertificate,
    clearError,
  } = useWorkerCertificateApi()

  useEffect(() => {
    if (lastRange.dateFrom && !startDate) {
      setStartDate(lastRange.dateFrom)
    }

    if (lastRange.dateTo && !endDate) {
      setEndDate(lastRange.dateTo)
    }
  }, [endDate, lastRange.dateFrom, lastRange.dateTo, startDate])

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()
    setLocalNotice(null)

    if (startDate && endDate && startDate > endDate) {
      setLocalNotice('Start date cannot be after end date.')
      return
    }

    try {
      await generateCertificate(startDate || undefined, endDate || undefined)
      setLocalNotice('Certificate generated successfully.')
    } catch {
      return
    }
  }

  const handlePrint = () => {
    if (!html) {
      setLocalNotice('Generate certificate first.')
      return
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=800')
    if (!printWindow) {
      setLocalNotice('Popup blocked. Please allow popups to print the certificate.')
      return
    }

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()

    window.setTimeout(() => {
      printWindow.print()
    }, 300)
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
            <ToastOnMessage message={localNotice} tone="info" onShown={() => setLocalNotice(null)} />

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-6">
              <div className="mb-5">
                <h2 className="text-2xl font-semibold text-[#1d1d1d]">Income Certificate</h2>
                <p className="mt-1 text-sm text-[#667085]">
                  Generate a print-ready certificate directly from verified earnings API data.
                </p>
              </div>

              <form onSubmit={handleGenerate} className="grid gap-4 md:grid-cols-3">
                <LabeledTextField
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  type="date"
                />
                <LabeledTextField
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  type="date"
                />
                <div className="flex items-end">
                  <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
                    {isLoading ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button type="button" variant="ghost" onClick={handlePrint} disabled={!html || isLoading}>
                  Print / Save as PDF
                </Button>
              </div>

            </section>

            {html ? (
              <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-5">
                <h3 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Certificate Preview</h3>
                <div className="overflow-hidden rounded-xl border border-[#dde2ea] bg-white">
                  <iframe
                    title="Income certificate preview"
                    srcDoc={html}
                    className="h-205 w-full"
                    sandbox="allow-same-origin allow-popups"
                  />
                </div>
              </section>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}

export default IncomeCertificatePage
