import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../../components/common/Button";
import { LabeledSelectField } from "../../components/common/LabeledSelectField";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopHeader } from "../../components/layout/TopHeader";
import { sidebarItems } from "../../data/dashboardData";
import type { SidebarItemId } from "../../types/dashboard";
import { classNames } from "../../utils/functions";

type GrievanceStatus = "Escalated" | "Resolved" | "Open";

type GrievanceCategory =
  | "Commission Hike"
  | "Wrongful Deactivation"
  | "Payment Delay"
  | "Incentive Issue"
  | "App Technical Issue"
  | "Other";

interface GrievancePost {
  id: string;
  platform: string;
  category: GrievanceCategory;
  description: string;
  status: GrievanceStatus;
  createdAt: string;
  postedBy: string;
}

const platformOptions = [
  { label: "Select platform", value: "" },
  { label: "Careem", value: "Careem" },
  { label: "foodpanda", value: "foodpanda" },
  { label: "Bykea", value: "Bykea" },
  { label: "InDrive", value: "InDrive" },
  { label: "Yango", value: "Yango" },
  { label: "Other", value: "Other" },
];

const categoryOptions = [
  { label: "Select category", value: "" },
  { label: "Commission Hike", value: "Commission Hike" },
  { label: "Wrongful Deactivation", value: "Wrongful Deactivation" },
  { label: "Payment Delay", value: "Payment Delay" },
  { label: "Incentive Issue", value: "Incentive Issue" },
  { label: "App Technical Issue", value: "App Technical Issue" },
  { label: "Other", value: "Other" },
];

const statusFilterOptions = [
  { label: "All Status", value: "all" },
  { label: "Escalated", value: "Escalated" },
  { label: "Resolved", value: "Resolved" },
  { label: "Open", value: "Open" },
];

const seedPosts: GrievancePost[] = [
  {
    id: "grv-001",
    platform: "Careem",
    category: "Commission Hike",
    description:
      "Commission moved from 12% to 16% this month without in-app communication. Requesting a transparent policy notice timeline.",
    status: "Escalated",
    createdAt: "2026-04-17",
    postedBy: "Worker #A19",
  },
  {
    id: "grv-002",
    platform: "foodpanda",
    category: "Payment Delay",
    description:
      "Weekly payout delayed by 3 days. Support ticket was acknowledged but no ETA was provided.",
    status: "Resolved",
    createdAt: "2026-04-16",
    postedBy: "Worker #F08",
  },
  {
    id: "grv-003",
    platform: "Bykea",
    category: "Wrongful Deactivation",
    description:
      "Account suspended after customer complaint even though GPS logs show the trip was completed correctly.",
    status: "Open",
    createdAt: "2026-04-15",
    postedBy: "Worker #B77",
  },
  {
    id: "grv-004",
    platform: "InDrive",
    category: "Incentive Issue",
    description:
      "Completed the required number of rides but peak-hour incentive was not reflected in the statement.",
    status: "Escalated",
    createdAt: "2026-04-13",
    postedBy: "Worker #I42",
  },
];

const getStatusClasses = (status: GrievanceStatus) => {
  switch (status) {
    case "Escalated":
      return "bg-amber-100 text-amber-700";
    case "Resolved":
      return "bg-emerald-100 text-emerald-700";
    case "Open":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-200 text-slate-700";
  }
};

const GrievanceBoardPage = () => {
  const [activeSidebarItem, setActiveSidebarItem] = useState<SidebarItemId>("greivance-board");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [platform, setPlatform] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [notice, setNotice] = useState("");

  const [posts, setPosts] = useState<GrievancePost[]>(seedPosts);

  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        const matchesStatus = filterStatus === "all" || post.status === filterStatus;
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          post.platform.toLowerCase().includes(q) ||
          post.category.toLowerCase().includes(q) ||
          post.description.toLowerCase().includes(q);

        return matchesStatus && matchesSearch;
      }),
    [posts, filterStatus, searchQuery],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!platform || !category || !description.trim()) {
      setNotice("Please complete platform, category, and description before posting.");
      return;
    }

    const anonymousId = `Worker #U${Math.floor(Math.random() * 900 + 100)}`;

    const newPost: GrievancePost = {
      id: `grv-${Date.now()}`,
      platform,
      category: category as GrievanceCategory,
      description: description.trim(),
      status: "Open",
      createdAt: new Date().toISOString().slice(0, 10),
      postedBy: anonymousId,
    };

    setPosts((prev) => [newPost, ...prev]);
    setNotice("Complaint posted anonymously to the board.");
    setPlatform("");
    setCategory("");
    setDescription("");
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
                  <h2 className="text-2xl font-semibold text-[#1d1d1d]">Grievance Board</h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    Anonymous worker complaints with advocate tags for Escalated and Resolved updates.
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
                  <Button type="submit">Post Anonymously</Button>
                  <span className="text-xs font-medium text-[#667085]">
                    Identity is hidden. Only anonymised worker ID is shown.
                  </span>
                </div>
              </form>

              {notice ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  {notice}
                </p>
              ) : null}
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-5">
              <h3 className="mb-4 text-lg font-semibold text-[#1d1d1d]">Community Posts</h3>

              <div className="grid gap-3">
                {filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#667085]">
                        <span className="rounded-full bg-white px-2.5 py-1 font-medium text-[#344054]">
                          {post.postedBy}
                        </span>
                        <span>{post.createdAt}</span>
                      </div>

                      <span
                        className={classNames(
                          "rounded-full px-2.5 py-1 text-xs font-medium",
                          getStatusClasses(post.status),
                        )}
                      >
                        {post.status}
                      </span>
                    </div>

                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[#475467]">
                      <span className="rounded-full bg-[#eef2f7] px-2.5 py-1 font-medium">{post.platform}</span>
                      <span className="rounded-full bg-[#eef2f7] px-2.5 py-1 font-medium">{post.category}</span>
                    </div>

                    <p className="text-sm leading-6 text-[#344054]">{post.description}</p>
                  </article>
                ))}
              </div>

              {!filteredPosts.length ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No posts match your filters.
                </p>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GrievanceBoardPage;
