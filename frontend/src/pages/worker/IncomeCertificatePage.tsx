import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../../components/common/Button";
import { LabeledTextField } from "../../components/common/LabeledTextField";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopHeader } from "../../components/layout/TopHeader";
import { sidebarItems } from "../../data/dashboardData";
import { useSidebarNavigation } from "../../hooks/useSidebarNavigation";
import { formatCurrency, formatHours } from "../../utils/functions";

type VerificationStatus = "Pending" | "Verified" | "Flagged" | "Unverifiable";

interface EarningEntry {
  id: string;
  date: string;
  platform: string;
  hours: number;
  gross: number;
  deductions: number;
  net: number;
  verificationStatus: VerificationStatus;
}

const earningEntries: EarningEntry[] = [
  {
    id: "cert-001",
    date: "2026-04-02",
    platform: "Careem",
    hours: 8,
    gross: 5400,
    deductions: 620,
    net: 4780,
    verificationStatus: "Verified",
  },
  {
    id: "cert-002",
    date: "2026-04-05",
    platform: "foodpanda",
    hours: 7.5,
    gross: 4900,
    deductions: 710,
    net: 4190,
    verificationStatus: "Verified",
  },
  {
    id: "cert-003",
    date: "2026-04-08",
    platform: "Bykea",
    hours: 6,
    gross: 3700,
    deductions: 420,
    net: 3280,
    verificationStatus: "Pending",
  },
  {
    id: "cert-004",
    date: "2026-04-11",
    platform: "Careem",
    hours: 8.5,
    gross: 5800,
    deductions: 680,
    net: 5120,
    verificationStatus: "Verified",
  },
  {
    id: "cert-005",
    date: "2026-04-14",
    platform: "InDrive",
    hours: 5.5,
    gross: 3200,
    deductions: 380,
    net: 2820,
    verificationStatus: "Flagged",
  },
  {
    id: "cert-006",
    date: "2026-04-17",
    platform: "foodpanda",
    hours: 9,
    gross: 6400,
    deductions: 910,
    net: 5490,
    verificationStatus: "Verified",
  },
];

const IncomeCertificatePage = () => {
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isGenerated, setIsGenerated] = useState(false);
  const [notice, setNotice] = useState("");

  const verifiedEntriesInRange = useMemo(() => {
    if (!startDate || !endDate) {
      return [] as EarningEntry[];
    }

    return earningEntries.filter(
      (entry) =>
        entry.verificationStatus === "Verified" &&
        entry.date >= startDate &&
        entry.date <= endDate,
    );
  }, [startDate, endDate]);

  const totalNet = verifiedEntriesInRange.reduce((sum, entry) => sum + entry.net, 0);
  const totalGross = verifiedEntriesInRange.reduce((sum, entry) => sum + entry.gross, 0);
  const totalHours = verifiedEntriesInRange.reduce((sum, entry) => sum + entry.hours, 0);

  const handleGenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!startDate || !endDate) {
      setNotice("Please select both start and end dates.");
      setIsGenerated(false);
      return;
    }

    if (startDate > endDate) {
      setNotice("Start date cannot be after end date.");
      setIsGenerated(false);
      return;
    }

    setIsGenerated(true);

    if (!verifiedEntriesInRange.length) {
      setNotice("No verified earnings found in this date range.");
      return;
    }

    setNotice(`Certificate generated with ${verifiedEntriesInRange.length} verified earning entries.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const issueDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="certificate-page min-h-screen bg-[#eceef2] text-[#1d1d1d]">
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
          }

          .no-print {
            display: none !important;
          }

          .print-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .printable-certificate {
            border: 1px solid #d1d5db !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 24px !important;
          }
        }
      `}</style>

      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="no-print">
          <Sidebar
            items={sidebarItems}
            activeItemId={activeSidebarItem}
            onItemSelect={onSidebarItemSelect}
          />
        </div>

        <main className="relative flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-(--color-button)/8 blur-3xl no-print" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#4a5d7d]/10 blur-3xl no-print" />

          <div className="print-container relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
            <div className="no-print">
              <TopHeader searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
            </div>

            <section className="no-print animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-6">
              <div className="mb-5">
                <h2 className="text-2xl font-semibold text-[#1d1d1d]">Income Certificate</h2>
                <p className="mt-1 text-sm text-[#667085]">
                  Generate a clean printable certificate for landlords, banks, or financial documentation.
                </p>
              </div>

              <form onSubmit={handleGenerate} className="grid gap-4 md:grid-cols-3">
                <LabeledTextField
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  type="date"
                  required
                />
                <LabeledTextField
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  type="date"
                  required
                />
                <div className="flex items-end">
                  <Button type="submit" className="w-full md:w-auto">
                    Generate
                  </Button>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button type="button" variant="ghost" onClick={handlePrint} disabled={!isGenerated}>
                  Print / Save as PDF
                </Button>
              </div>

              {notice ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  {notice}
                </p>
              ) : null}
            </section>

            {isGenerated ? (
              <section className="printable-certificate animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-6 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-8">
                <div className="mb-6 border-b border-[#e4e7ec] pb-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#667085]">FairGig Worker Earnings Verification</p>
                  <h3 className="mt-2 text-3xl font-bold text-[#1d1d1d]">Income Certificate</h3>
                  <p className="mt-2 text-sm text-[#4f5b70]">
                    This document certifies verified platform earnings for the specified date range.
                  </p>
                </div>

                <div className="mb-6 grid gap-3 text-sm text-[#344054] md:grid-cols-2">
                  <p>
                    <span className="font-semibold text-[#1d1d1d]">Issue Date:</span> {issueDate}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1d1d1d]">Certificate Range:</span> {startDate} to {endDate}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1d1d1d]">Included Entries:</span> {verifiedEntriesInRange.length} (Verified only)
                  </p>
                  <p>
                    <span className="font-semibold text-[#1d1d1d]">Purpose:</span> Landlord / Bank Income Verification
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                    <thead>
                      <tr className="text-left text-[#657083]">
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Platform</th>
                        <th className="px-3 py-2 font-medium">Hours</th>
                        <th className="px-3 py-2 font-medium">Gross</th>
                        <th className="px-3 py-2 font-medium">Deductions</th>
                        <th className="px-3 py-2 font-medium">Net</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifiedEntriesInRange.map((entry) => (
                        <tr key={entry.id} className="rounded-xl bg-[#f8f9fb]">
                          <td className="rounded-l-xl px-3 py-3 font-medium text-[#1d1d1d]">{entry.date}</td>
                          <td className="px-3 py-3 text-[#3f4a5f]">{entry.platform}</td>
                          <td className="px-3 py-3 text-[#3f4a5f]">{formatHours(entry.hours)}</td>
                          <td className="px-3 py-3 text-[#3f4a5f]">{formatCurrency(entry.gross)}</td>
                          <td className="px-3 py-3 text-[#3f4a5f]">{formatCurrency(entry.deductions)}</td>
                          <td className="px-3 py-3 font-medium text-[#1d1d1d]">{formatCurrency(entry.net)}</td>
                          <td className="rounded-r-xl px-3 py-3">
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              Verified
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 grid gap-3 rounded-xl border border-[#e4e7ec] bg-[#f7f8fa] p-4 text-sm text-[#344054] md:grid-cols-3">
                  <p>
                    <span className="font-semibold text-[#1d1d1d]">Total Hours:</span> {formatHours(totalHours)}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1d1d1d]">Total Gross:</span> {formatCurrency(totalGross)}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1d1d1d]">Total Net:</span> {formatCurrency(totalNet)}
                  </p>
                </div>

                <p className="mt-6 text-xs leading-6 text-[#667085]">
                  This certificate is system-generated by FairGig and includes only entries with verified status in the selected period.
                  It is intended for third-party financial review and proof of income documentation.
                </p>
              </section>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
};

export default IncomeCertificatePage;
