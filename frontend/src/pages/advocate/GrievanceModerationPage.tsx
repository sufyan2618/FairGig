import { useMemo, useState } from "react";
import { Button } from "../../components/common/Button";
import { LabeledSelectField } from "../../components/common/LabeledSelectField";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopHeader } from "../../components/layout/TopHeader";
import { advocateSidebarItems } from "../../data/advocateData";
import { useSidebarNavigation } from "../../hooks/useSidebarNavigation";
import { classNames } from "../../utils/functions";

type ModerationStatus = "Open" | "Escalated" | "Resolved";
type ComplaintCategory =
  | "Commission Hike"
  | "Wrongful Deactivation"
  | "Payment Delay"
  | "Incentive Issue"
  | "App Technical Issue"
  | "Other";
type ModerationTag =
  | "commission hike"
  | "wrongful deactivation"
  | "payment delay"
  | "incentive gap"
  | "technical issue"
  | "other";

interface ModerationPost {
  id: string;
  platform: string;
  category: ComplaintCategory;
  description: string;
  status: ModerationStatus;
  createdAt: string;
  postedBy: string;
  moderationTag: ModerationTag;
  clusterId: string;
}

const platformFilterOptions = [
  { label: "All Platforms", value: "all" },
  { label: "Careem", value: "Careem" },
  { label: "foodpanda", value: "foodpanda" },
  { label: "Bykea", value: "Bykea" },
  { label: "InDrive", value: "InDrive" },
  { label: "Yango", value: "Yango" },
];

const categoryFilterOptions = [
  { label: "All Categories", value: "all" },
  { label: "Commission Hike", value: "Commission Hike" },
  { label: "Wrongful Deactivation", value: "Wrongful Deactivation" },
  { label: "Payment Delay", value: "Payment Delay" },
  { label: "Incentive Issue", value: "Incentive Issue" },
  { label: "App Technical Issue", value: "App Technical Issue" },
  { label: "Other", value: "Other" },
];

const statusFilterOptions = [
  { label: "All Status", value: "all" },
  { label: "Open", value: "Open" },
  { label: "Escalated", value: "Escalated" },
  { label: "Resolved", value: "Resolved" },
];

const tagFilterOptions = [
  { label: "All Tags", value: "all" },
  { label: "commission hike", value: "commission hike" },
  { label: "wrongful deactivation", value: "wrongful deactivation" },
  { label: "payment delay", value: "payment delay" },
  { label: "incentive gap", value: "incentive gap" },
  { label: "technical issue", value: "technical issue" },
  { label: "other", value: "other" },
];

const moderationTagOptions = [
  { label: "commission hike", value: "commission hike" },
  { label: "wrongful deactivation", value: "wrongful deactivation" },
  { label: "payment delay", value: "payment delay" },
  { label: "incentive gap", value: "incentive gap" },
  { label: "technical issue", value: "technical issue" },
  { label: "other", value: "other" },
];

const initialPosts: ModerationPost[] = [
  {
    id: "adv-grv-001",
    platform: "Careem",
    category: "Commission Hike",
    description:
      "Commission moved from 12% to 16% with no prior notice. Drivers report sudden drops in take-home income.",
    status: "Open",
    createdAt: "2026-04-17",
    postedBy: "Worker #A19",
    moderationTag: "commission hike",
    clusterId: "careem-commission-hike",
  },
  {
    id: "adv-grv-002",
    platform: "foodpanda",
    category: "Payment Delay",
    description:
      "Weekly payout delayed by 3 days despite completed delivery targets.",
    status: "Escalated",
    createdAt: "2026-04-16",
    postedBy: "Worker #F08",
    moderationTag: "payment delay",
    clusterId: "foodpanda-payment-delay",
  },
  {
    id: "adv-grv-003",
    platform: "Bykea",
    category: "Wrongful Deactivation",
    description:
      "Account suspended after a disputed report although route logs and screenshots were submitted.",
    status: "Open",
    createdAt: "2026-04-15",
    postedBy: "Worker #B77",
    moderationTag: "wrongful deactivation",
    clusterId: "bykea-deactivation-wave",
  },
  {
    id: "adv-grv-004",
    platform: "InDrive",
    category: "Incentive Issue",
    description:
      "Peak-hour incentive not reflected in statement after crossing required ride threshold.",
    status: "Resolved",
    createdAt: "2026-04-13",
    postedBy: "Worker #I42",
    moderationTag: "incentive gap",
    clusterId: "indrive-incentive-gap",
  },
];

const getStatusClass = (status: ModerationStatus) => {
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

const buildClusterId = (platform: string, category: ComplaintCategory) =>
  `${platform.toLowerCase()}-${category.toLowerCase().replace(/\s+/g, "-")}`;

const GrievanceModerationPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [notice, setNotice] = useState("");

  const [posts, setPosts] = useState<ModerationPost[]>(initialPosts);
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation();

  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        const matchesStatus = statusFilter === "all" || post.status === statusFilter;
        const matchesPlatform =
          platformFilter === "all" || post.platform === platformFilter;
        const matchesCategory =
          categoryFilter === "all" || post.category === categoryFilter;
        const matchesTag = tagFilter === "all" || post.moderationTag === tagFilter;

        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          post.platform.toLowerCase().includes(query) ||
          post.category.toLowerCase().includes(query) ||
          post.description.toLowerCase().includes(query) ||
          post.clusterId.toLowerCase().includes(query) ||
          post.moderationTag.toLowerCase().includes(query);

        return (
          matchesStatus &&
          matchesPlatform &&
          matchesCategory &&
          matchesTag &&
          matchesSearch
        );
      }),
    [posts, statusFilter, platformFilter, categoryFilter, tagFilter, searchQuery],
  );

  const updatePost = (postId: string, updater: (post: ModerationPost) => ModerationPost) => {
    setPosts((previous) => previous.map((post) => (post.id === postId ? updater(post) : post)));
  };

  const handleTagUpdate = (postId: string, value: string) => {
    updatePost(postId, (post) => ({
      ...post,
      moderationTag: value as ModerationTag,
    }));
    setNotice("Complaint tag updated.");
  };

  const handleClusterSimilar = (targetPost: ModerationPost) => {
    const clusterId = buildClusterId(targetPost.platform, targetPost.category);

    setPosts((previous) =>
      previous.map((post) =>
        post.platform === targetPost.platform && post.category === targetPost.category
          ? { ...post, clusterId }
          : post,
      ),
    );

    setNotice(`Clustered similar complaints under ${clusterId}.`);
  };

  const handleStatusChange = (postId: string, status: ModerationStatus) => {
    updatePost(postId, (post) => ({ ...post, status }));
    setNotice(`Post marked as ${status}.`);
  };

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

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <LabeledSelectField
                  label="Tag"
                  options={tagFilterOptions}
                  value={tagFilter}
                  onChange={setTagFilter}
                />
                <LabeledSelectField
                  label="Platform"
                  options={platformFilterOptions}
                  value={platformFilter}
                  onChange={setPlatformFilter}
                />
                <LabeledSelectField
                  label="Category"
                  options={categoryFilterOptions}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                />
                <LabeledSelectField
                  label="Escalation Status"
                  options={statusFilterOptions}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              </div>

              {notice ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  {notice}
                </p>
              ) : null}
            </section>

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-4 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-5">
              <h3 className="mb-4 text-lg font-semibold text-[#1d1d1d]">Incoming Complaints</h3>

              <div className="grid gap-3">
                {filteredPosts.map((post) => (
                  <article key={post.id} className="rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#667085]">
                        <span className="rounded-full bg-white px-2.5 py-1 font-medium text-[#344054]">
                          {post.postedBy}
                        </span>
                        <span>{post.createdAt}</span>
                        <span className="rounded-full bg-[#eef2f7] px-2.5 py-1 font-medium text-[#344054]">
                          Cluster: {post.clusterId}
                        </span>
                      </div>

                      <span className={classNames("rounded-full px-2.5 py-1 text-xs font-medium", getStatusClass(post.status))}>
                        {post.status}
                      </span>
                    </div>

                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#475467]">
                      <span className="rounded-full bg-[#eef2f7] px-2.5 py-1 font-medium">{post.platform}</span>
                      <span className="rounded-full bg-[#eef2f7] px-2.5 py-1 font-medium">{post.category}</span>
                      <span className="rounded-full bg-[#dde7fb] px-2.5 py-1 font-medium text-[#2d4a7a]">
                        tag: {post.moderationTag}
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-[#344054]">{post.description}</p>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr]">
                      <LabeledSelectField
                        label="Tag Complaint"
                        options={moderationTagOptions}
                        value={post.moderationTag}
                        onChange={(value) => handleTagUpdate(post.id, value)}
                      />

                      <div className="flex flex-wrap items-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleClusterSimilar(post)}>
                          Cluster Similar
                        </Button>
                        <Button type="button" size="sm" onClick={() => handleStatusChange(post.id, "Escalated")}>
                          Mark as Escalated
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleStatusChange(post.id, "Resolved")}>
                          Mark as Resolved
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {!filteredPosts.length ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  No complaints match the active moderation filters.
                </p>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GrievanceModerationPage;
