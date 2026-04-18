import { useMemo, useRef, useState } from "react";
import { Button } from "../../components/common/Button";
import { LabeledSelectField } from "../../components/common/LabeledSelectField";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopHeader } from "../../components/layout/TopHeader";
import { sidebarItems } from "../../data/dashboardData";
import { useSidebarNavigation } from "../../hooks/useSidebarNavigation";
import { classNames } from "../../utils/functions";

type VerificationStatus = "Pending" | "Verified" | "Flagged" | "Unverifiable";

interface ShiftLogOption {
  id: string;
  label: string;
  platform: string;
  date: string;
  verificationStatus: VerificationStatus;
}

const shiftLogs: ShiftLogOption[] = [
  {
    id: "shift-001",
    label: "Apr 16, 2026 - Careem (8.5 hrs)",
    platform: "Careem",
    date: "2026-04-16",
    verificationStatus: "Pending",
  },
  {
    id: "shift-002",
    label: "Apr 15, 2026 - foodpanda (7 hrs)",
    platform: "foodpanda",
    date: "2026-04-15",
    verificationStatus: "Verified",
  },
  {
    id: "shift-003",
    label: "Apr 14, 2026 - Bykea (6 hrs)",
    platform: "Bykea",
    date: "2026-04-14",
    verificationStatus: "Flagged",
  },
  {
    id: "shift-004",
    label: "Apr 13, 2026 - InDrive (5.5 hrs)",
    platform: "InDrive",
    date: "2026-04-13",
    verificationStatus: "Unverifiable",
  },
];

const shiftOptions = [
  { label: "Select shift log", value: "" },
  ...shiftLogs.map((shift) => ({ label: shift.label, value: shift.id })),
];

const getStatusBadgeClass = (status: VerificationStatus) => {
  switch (status) {
    case "Pending":
      return "bg-amber-100 text-amber-700";
    case "Verified":
      return "bg-emerald-100 text-emerald-700";
    case "Flagged":
      return "bg-rose-100 text-rose-700";
    case "Unverifiable":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-200 text-slate-700";
  }
};

const UploadScreenshotPage = () => {
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [currentStatus, setCurrentStatus] = useState<VerificationStatus | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedShift = useMemo(
    () => shiftLogs.find((shift) => shift.id === selectedShiftId) ?? null,
    [selectedShiftId],
  );

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadProgress(0);

    if (file) {
      setNotice(`Selected file: ${file.name}`);
    }
  };

  const handleSubmitUpload = () => {
    if (!selectedShiftId) {
      setNotice("Choose a shift log first.");
      return;
    }

    if (!selectedFile) {
      setNotice("Select a screenshot file before upload.");
      return;
    }

    setIsUploading(true);
    setNotice("Uploading screenshot...");
    setUploadProgress(0);

    const timer = window.setInterval(() => {
      setUploadProgress((prev) => {
        const next = Math.min(prev + 12, 100);

        if (next >= 100) {
          window.clearInterval(timer);
          setIsUploading(false);
          setCurrentStatus("Pending");
          setNotice("Screenshot uploaded successfully. Verification status is now Pending.");
        }

        return next;
      });
    }, 180);
  };

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

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-[#1d1d1d]">Upload Screenshot</h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    Attach a platform earnings screenshot to a specific shift log for verification.
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
                />

                <div className="flex w-full flex-col gap-1">
                  <span className="text-xs font-medium text-[#5f6673]">Screenshot File</span>
                  <div className="flex h-11 items-center gap-2 rounded-xl border border-[#d9dde4] bg-white px-3">
                    <span className="truncate text-sm text-[#1d1d1d]">
                      {selectedFile ? selectedFile.name : "No file selected"}
                    </span>
                    <Button type="button" size="sm" variant="ghost" onClick={openFilePicker} className="ml-auto">
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

              <div className="mt-5 rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-[#344054]">Upload Progress</span>
                  <span className="text-[#667085]">{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#dbe1ea]">
                  <div
                    className="h-full rounded-full bg-(--color-button) transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button type="button" onClick={handleSubmitUpload} disabled={isUploading}>
                  {isUploading ? "Uploading..." : "Submit Screenshot"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadProgress(0);
                    setNotice("");
                  }}
                  disabled={isUploading}
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
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        getStatusBadgeClass(currentStatus ?? selectedShift.verificationStatus),
                      )}
                    >
                      {currentStatus ?? selectedShift.verificationStatus}
                    </span>
                  </div>
                </div>
              ) : null}

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
  );
};

export default UploadScreenshotPage;
