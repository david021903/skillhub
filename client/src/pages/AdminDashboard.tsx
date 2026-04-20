import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PageIntro } from "@/components/PageIntro";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Package,
  MessageSquare,
  Star,
  GitPullRequest,
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
  Archive,
  Activity,
  TrendingUp,
  UserPlus,
  ChevronRight,
  RefreshCw,
  X,
  Download,
} from "@/components/ui/icons";
import { usePageSeo } from "@/lib/seo";

type ActivityEvent = {
  type: string;
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
  skillId?: string;
  skillName?: string;
  skillSlug?: string;
  ownerHandle?: string;
  link?: string;
  state?: string;
  number?: number;
  isPublic?: boolean;
};

type AdminStats = {
  totalUsers: number;
  todaySignups: number;
  totalSkills: number;
  newSkillsThisWeek: number;
  totalComments: number;
  todayComments: number;
  totalIssues: number;
  totalPRs: number;
  totalDownloads: number;
  todayInstalls: number;
  weekInstalls: number;
};

type UserDetail = {
  user: {
    id: string;
    email: string;
    handle: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
    bio: string;
    isAdmin: boolean;
    createdAt: string;
  };
  skills: any[];
  comments: any[];
  stats: {
    totalSkills: number;
    totalStars: number;
    totalIssues: number;
    totalComments: number;
  };
};

const EVENT_ICONS: Record<string, any> = {
  comment: MessageSquare,
  skill: Package,
  user: UserPlus,
  star: Star,
  issue: AlertCircle,
  pr: GitPullRequest,
  install: Download,
};

const EVENT_COLORS: Record<string, string> = {
  comment: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  skill: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  user: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  star: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  issue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  pr: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  install: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

const EVENT_LABELS: Record<string, string> = {
  comment: "Comment",
  skill: "New Skill",
  user: "New User",
  star: "Star",
  issue: "Issue",
  pr: "Pull Request",
  install: "Download",
};

const FILTER_OPTIONS = [
  { value: "all", label: "All Activity" },
  { value: "comments", label: "Comments" },
  { value: "skills", label: "New Skills" },
  { value: "users", label: "New Users" },
  { value: "stars", label: "Stars" },
  { value: "issues", label: "Issues" },
  { value: "prs", label: "Pull Requests" },
  { value: "installs", label: "Downloads" },
];

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function AdminDashboard() {
  const [filter, setFilter] = useState("all");
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [userDetailId, setUserDetailId] = useState<string | null>(null);
  const [skillActionDialog, setSkillActionDialog] = useState<{ id: string; name: string; action: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  usePageSeo({
    title: "Admin Dashboard",
    description:
      "Monitor TraderClaw Skills users, activity, comments, moderation actions, and registry growth from the admin console.",
    canonicalPath: "/admin",
    robots: "noindex,nofollow",
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: activity = [], isLoading: activityLoading, refetch: refetchActivity } = useQuery<ActivityEvent[]>({
    queryKey: ["/api/admin/activity", filter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/activity?type=${filter}&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: userDetail, isLoading: userDetailLoading } = useQuery<UserDetail>({
    queryKey: ["/api/admin/users", userDetailId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userDetailId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!userDetailId,
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/admin/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete comment");
    },
    onSuccess: () => {
      toast({ title: "Comment deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity"] });
    },
  });

  const bulkDeleteComments = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/admin/comments/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Failed to delete comments");
    },
    onSuccess: () => {
      toast({ title: `${selectedComments.size} comments deleted` });
      setSelectedComments(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity"] });
    },
  });

  const flagSkill = useMutation({
    mutationFn: async ({ skillId, action }: { skillId: string; action: string }) => {
      const res = await fetch(`/api/admin/skills/${skillId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Failed to update skill");
    },
    onSuccess: () => {
      toast({ title: "Skill updated" });
      setSkillActionDialog(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity"] });
    },
  });

  const toggleCommentSelection = (id: string) => {
    setSelectedComments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const commentEvents = activity.filter(e => e.type === "comment");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageIntro
        tag="ADMIN DASHBOARD"
        title="Monitor Registry Activity"
        description="Review growth, moderation signals, and platform activity across TraderClaw Skills."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
              refetchActivity();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{statsLoading ? "..." : stats?.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +{stats?.todaySignups || 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Skills</p>
                <p className="text-2xl font-bold">{statsLoading ? "..." : stats?.totalSkills}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +{stats?.newSkillsThisWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Downloads</p>
                <p className="text-2xl font-bold">{statsLoading ? "..." : stats?.totalDownloads || 0}</p>
              </div>
              <Download className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +{stats?.todayInstalls || 0} today / +{stats?.weekInstalls || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comments</p>
                <p className="text-2xl font-bold">{statsLoading ? "..." : stats?.totalComments}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +{stats?.todayComments || 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Issues / PRs</p>
                <p className="text-2xl font-bold">{statsLoading ? "..." : `${stats?.totalIssues || 0} / ${stats?.totalPRs || 0}`}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Activity Feed</CardTitle>
                <div className="flex items-center gap-2">
                  {selectedComments.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => bulkDeleteComments.mutate(Array.from(selectedComments))}
                      disabled={bulkDeleteComments.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete {selectedComments.size}
                    </Button>
                  )}
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[160px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FILTER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-3 p-3">
                      <div className="h-8 w-8 bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No activity found</p>
              ) : (
                <div className="space-y-1">
                  {activity.map((event) => {
                    const Icon = EVENT_ICONS[event.type] || Activity;
                    const colorClass = EVENT_COLORS[event.type] || "bg-gray-100 text-gray-700";
                    const isComment = event.type === "comment";

                    return (
                      <div
                        key={`${event.type}-${event.id}`}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        {isComment && (
                          <Checkbox
                            checked={selectedComments.has(event.id)}
                            onCheckedChange={() => toggleCommentSelection(event.id)}
                            className="mt-1"
                          />
                        )}
                        <div className={`shrink-0 border border-border p-1.5 ${colorClass}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {EVENT_LABELS[event.type] || event.type}
                            </Badge>
                            <button
                              onClick={() => setUserDetailId(event.userId)}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              @{event.userName}
                            </button>
                            {event.skillName && (
                              <>
                                <span className="text-xs text-muted-foreground">on</span>
                                <Link
                                  href={event.link || "#"}
                                  className="text-sm text-primary hover:underline truncate"
                                >
                                  {event.skillName}
                                </Link>
                              </>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto shrink-0">
                              {timeAgo(event.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {event.content}
                          </p>
                          {event.state && (
                            <Badge variant={event.state === "open" ? "default" : "secondary"} className="mt-1 text-xs">
                              {event.state}
                            </Badge>
                          )}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                          {isComment && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => deleteComment.mutate(event.id)}
                              disabled={deleteComment.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {event.type === "skill" && event.skillId && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title={event.isPublic ? "Make Private" : "Make Public"}
                                onClick={() => setSkillActionDialog({
                                  id: event.skillId!,
                                  name: event.skillName || "",
                                  action: event.isPublic ? "make_private" : "make_public",
                                })}
                              >
                                {event.isPublic ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Archive"
                                onClick={() => setSkillActionDialog({
                                  id: event.skillId!,
                                  name: event.skillName || "",
                                  action: "archive",
                                })}
                              >
                                <Archive className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                title="Delete"
                                onClick={() => setSkillActionDialog({
                                  id: event.skillId!,
                                  name: event.skillName || "",
                                  action: "delete",
                                })}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {event.link && (
                            <Link href={event.link}>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Signups Today</span>
                <span className="font-semibold">{stats?.todaySignups || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">New Skills (7d)</span>
                <span className="font-semibold">{stats?.newSkillsThisWeek || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Comments Today</span>
                <span className="font-semibold">{stats?.todayComments || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Open Issues</span>
                <span className="font-semibold">{stats?.totalIssues || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Open PRs</span>
                <span className="font-semibold">{stats?.totalPRs || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Moderation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Hover over items in the activity feed to see moderation actions. Use checkboxes on comments for bulk delete.
              </p>
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span>Delete comments (single or bulk)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <EyeOff className="h-4 w-4" />
                  <span>Make skills private/public</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Archive className="h-4 w-4" />
                  <span>Archive or delete skills</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>Click usernames for user overview</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!userDetailId} onOpenChange={(open) => !open && setUserDetailId(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Overview</DialogTitle>
          </DialogHeader>
          {userDetailLoading ? (
            <div className="space-y-3 py-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : userDetail ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {userDetail.user.profileImageUrl ? (
                  <img src={userDetail.user.profileImageUrl} alt="" className="h-12 w-12 object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center bg-primary/10 text-lg font-bold text-primary">
                    {userDetail.user.handle?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{userDetail.user.firstName} {userDetail.user.lastName}</p>
                  <p className="text-sm text-muted-foreground">@{userDetail.user.handle} &middot; {userDetail.user.email}</p>
                  <p className="text-xs text-muted-foreground">Joined {new Date(userDetail.user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {userDetail.user.bio && (
                <p className="text-sm text-muted-foreground">{userDetail.user.bio}</p>
              )}

              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-2 bg-muted rounded-lg">
                  <p className="text-lg font-bold">{userDetail.stats.totalSkills}</p>
                  <p className="text-xs text-muted-foreground">Skills</p>
                </div>
                <div className="text-center p-2 bg-muted rounded-lg">
                  <p className="text-lg font-bold">{userDetail.stats.totalStars}</p>
                  <p className="text-xs text-muted-foreground">Stars</p>
                </div>
                <div className="text-center p-2 bg-muted rounded-lg">
                  <p className="text-lg font-bold">{userDetail.stats.totalComments}</p>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
                <div className="text-center p-2 bg-muted rounded-lg">
                  <p className="text-lg font-bold">{userDetail.stats.totalIssues}</p>
                  <p className="text-xs text-muted-foreground">Issues</p>
                </div>
              </div>

              {userDetail.skills.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Skills ({userDetail.skills.length})</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {userDetail.skills.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between text-sm p-1.5 rounded hover:bg-muted">
                        <Link href={`/skills/${userDetail.user.handle}/${s.slug}`} className="text-primary hover:underline">
                          {s.name}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{s.stars} stars</span>
                          {!s.isPublic && <Badge variant="secondary" className="text-xs">Private</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {userDetail.comments.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Recent Comments ({userDetail.comments.length})</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {userDetail.comments.slice(0, 10).map((c: any) => (
                      <div key={c.id} className="text-sm p-2 bg-muted/50 rounded group">
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/skills/${c.ownerHandle}/${c.skillSlug}`}
                            className="text-xs text-primary hover:underline"
                          >
                            {c.skillName}
                          </Link>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                              onClick={() => deleteComment.mutate(c.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-muted-foreground line-clamp-2 mt-1">{c.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Link href={`/users/${userDetail.user.handle}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Public Profile
                  </Button>
                </Link>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!skillActionDialog} onOpenChange={(open) => !open && setSkillActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {skillActionDialog?.action === "delete" ? "Delete Skill" :
               skillActionDialog?.action === "archive" ? "Archive Skill" :
               skillActionDialog?.action === "make_private" ? "Make Skill Private" :
               "Make Skill Public"}
            </DialogTitle>
            <DialogDescription>
              {skillActionDialog?.action === "delete"
                ? `Are you sure you want to permanently delete "${skillActionDialog?.name}"? This cannot be undone.`
                : `Are you sure you want to ${skillActionDialog?.action?.replace("_", " ")} "${skillActionDialog?.name}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkillActionDialog(null)}>Cancel</Button>
            <Button
              variant={skillActionDialog?.action === "delete" ? "destructive" : "default"}
              onClick={() => {
                if (skillActionDialog) {
                  flagSkill.mutate({ skillId: skillActionDialog.id, action: skillActionDialog.action });
                }
              }}
              disabled={flagSkill.isPending}
            >
              {flagSkill.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
