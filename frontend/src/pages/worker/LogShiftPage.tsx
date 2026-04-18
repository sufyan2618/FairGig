import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "../../components/common/Button";
import { LabeledSelectField } from "../../components/common/LabeledSelectField";
import { LabeledTextField } from "../../components/common/LabeledTextField";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopHeader } from "../../components/layout/TopHeader";
import { sidebarItems } from "../../data/dashboardData";
import type { SidebarItemId } from "../../types/dashboard";

interface ShiftFormData {
  platform: string;
  date: string;
  hoursWorked: string;
  grossEarned: string;
  platformDeductions: string;
  netReceived: string;
}

interface ShiftRow extends ShiftFormData {
  id: string;
}

const platformOptions = [
  { label: "Select platform", value: "" },
  { label: "Careem", value: "careem" },
  { label: "foodpanda", value: "foodpanda" },
  { label: "Bykea", value: "bykea" },
  { label: "InDrive", value: "indrive" },
  { label: "Yango", value: "yango" },
  { label: "Other", value: "other" },
];

const csvHeaders = [
  "platform",
  "date",
  "hoursWorked",
  "grossEarned",
  "platformDeductions",
  "netReceived",
] as const;

const initialFormData: ShiftFormData = {
  platform: "",
  date: "",
  hoursWorked: "",
  grossEarned: "",
  platformDeductions: "",
  netReceived: "",
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(value.trim());
      value = "";
      continue;
    }

    value += char;
  }

  values.push(value.trim());
  return values;
};

const LogShiftPage = () => {
  const [activeSidebarItem, setActiveSidebarItem] = useState<SidebarItemId>("log-shift");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<ShiftFormData>(initialFormData);
  const [importRows, setImportRows] = useState<ShiftRow[]>([]);
  const [notice, setNotice] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const csvPreview = useMemo(() => importRows.slice(0, 8), [importRows]);

  const updateField = (key: keyof ShiftFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateShiftRow = (row: ShiftFormData) =>
    csvHeaders.every((field) => row[field].toString().trim().length > 0);

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateShiftRow(formData)) {
      setNotice("Please fill in all fields before submitting the shift.");
      return;
    }

    setNotice("Shift submitted successfully.");
    setFormData(initialFormData);
  };

  const handleBulkImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleCsvFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      setImportRows([]);
      setNotice("CSV needs a header row and at least one data row.");
      event.target.value = "";
      return;
    }

    const [headerLine, ...dataLines] = lines;
    const parsedHeaders = parseCsvLine(headerLine).map((header) => header.trim());

    const hasExpectedHeaders = csvHeaders.every((header, index) => parsedHeaders[index] === header);
    if (!hasExpectedHeaders) {
      setImportRows([]);
      setNotice(
        "Invalid CSV format. Expected headers: platform,date,hoursWorked,grossEarned,platformDeductions,netReceived",
      );
      event.target.value = "";
      return;
    }

    const parsedRows = dataLines
      .map((line, index) => {
        const values = parseCsvLine(line);
        if (values.length < csvHeaders.length) {
          return null;
        }

        return {
          id: `${Date.now()}-${index}`,
          platform: values[0],
          date: values[1],
          hoursWorked: values[2],
          grossEarned: values[3],
          platformDeductions: values[4],
          netReceived: values[5],
        } satisfies ShiftRow;
      })
      .filter((row): row is ShiftRow => Boolean(row));

    if (!parsedRows.length) {
      setImportRows([]);
      setNotice("No valid rows found in CSV.");
      event.target.value = "";
      return;
    }

    setImportRows(parsedRows);
    setNotice(`Loaded ${parsedRows.length} row(s). Review preview before final submission.`);
    event.target.value = "";
  };

  const handleCsvSubmit = () => {
    if (!importRows.length) {
      setNotice("Import a CSV file first.");
      return;
    }

    setNotice(`Submitted ${importRows.length} imported shift row(s).`);
    setImportRows([]);
  };

  return (
    <div className="min-h-screen bg-[#eceef2] text-[#1d1d1d]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar
          items={sidebarItems}
          activeItemId={activeSidebarItem}
          onItemSelect={setActiveSidebarItem}
        />

        <main className="relative flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-(--color-button)/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#4a5d7d]/10 blur-3xl" />

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
            <TopHeader searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-[#1d1d1d]">Log a Shift</h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    Enter your shift details manually or import a CSV for bulk upload.
                  </p>
                </div>
                <Button variant="ghost" onClick={handleBulkImportClick}>
                  Bulk Import via CSV
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleCsvFileUpload}
                />
              </div>

              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleManualSubmit}>
                <LabeledSelectField
                  label="Platform"
                  options={platformOptions}
                  value={formData.platform}
                  onChange={(value) => updateField("platform", value)}
                  required
                />
                <LabeledTextField
                  label="Date"
                  value={formData.date}
                  onChange={(value) => updateField("date", value)}
                  type="date"
                  required
                />
                <LabeledTextField
                  label="Hours Worked"
                  value={formData.hoursWorked}
                  onChange={(value) => updateField("hoursWorked", value)}
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g. 8.5"
                  required
                />
                <LabeledTextField
                  label="Gross Earned"
                  value={formData.grossEarned}
                  onChange={(value) => updateField("grossEarned", value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 4500"
                  required
                />
                <LabeledTextField
                  label="Platform Deductions"
                  value={formData.platformDeductions}
                  onChange={(value) => updateField("platformDeductions", value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 450"
                  required
                />
                <LabeledTextField
                  label="Net Received"
                  value={formData.netReceived}
                  onChange={(value) => updateField("netReceived", value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 4050"
                  required
                />

                <div className="md:col-span-2 mt-2 flex flex-wrap items-center gap-3">
                  <Button type="submit">Submit</Button>
                  {importRows.length ? (
                    <Button type="button" variant="ghost" onClick={handleCsvSubmit}>
                      Submit Imported Rows
                    </Button>
                  ) : null}
                </div>
              </form>

              {notice ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  {notice}
                </p>
              ) : null}
            </section>

            {importRows.length ? (
              <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#1d1d1d]">CSV Preview</h3>
                  <span className="text-sm text-[#667085]">Showing {csvPreview.length} of {importRows.length} rows</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                    <thead>
                      <tr className="text-left text-[#657083]">
                        <th className="px-3 py-2 font-medium">Platform</th>
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Hours Worked</th>
                        <th className="px-3 py-2 font-medium">Gross Earned</th>
                        <th className="px-3 py-2 font-medium">Platform Deductions</th>
                        <th className="px-3 py-2 font-medium">Net Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((row) => (
                        <tr key={row.id} className="rounded-xl bg-[#f8f9fb] text-[#3f4a5f]">
                          <td className="rounded-l-xl px-3 py-3 font-medium text-[#1d1d1d]">{row.platform}</td>
                          <td className="px-3 py-3">{row.date}</td>
                          <td className="px-3 py-3">{row.hoursWorked}</td>
                          <td className="px-3 py-3">{row.grossEarned}</td>
                          <td className="px-3 py-3">{row.platformDeductions}</td>
                          <td className="rounded-r-xl px-3 py-3">{row.netReceived}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LogShiftPage;
