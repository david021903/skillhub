import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SkillCard from "@/components/SkillCard";
import { RouteLoader } from "@/components/RouteLoader";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Download,
  Package,
  Star,
  Upload,
} from "@/components/ui/icons";
import { FRONTEND_ONLY_PREVIEW } from "@/lib/frontend-only";
import { toMetaDescription, usePageSeo } from "@/lib/seo";

type TabType = "overview" | "dashboard" | "skills" | "stars";

const BIO_MAX_LENGTH = 500;
const AVATAR_FILE_MAX_BYTES = 3 * 1024 * 1024;
const numberFormatter = new Intl.NumberFormat("en-US");

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read the selected image"));
    reader.readAsDataURL(file);
  });
}

function getInitials(name: string, fallback = "U") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || fallback;
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export default function Profile() {
  const [, usersParams] = useRoute("/users/:handle");
  const [, uParams] = useRoute("/u/:handle");
  const [, skillsOwnerParams] = useRoute("/skills/:owner");
  const params = usersParams || uParams || (skillsOwnerParams ? { handle: skillsOwnerParams.owner } : null);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const pathname = location.split("?")[0] || "/profile";
  const queryString = location.split("?")[1] || "";

  const routeHandle = params?.handle;
  const currentUserHandle = (user as any)?.handle;
  const isOwnProfile = !routeHandle || routeHandle === currentUserHandle || routeHandle === "me";
  const handle = routeHandle === "me" ? currentUserHandle : routeHandle || (isOwnProfile ? currentUserHandle : undefined);
  const isPublicProfileRoute =
    pathname.startsWith("/users/") ||
    pathname.startsWith("/u/") ||
    /^\/skills\/[^/]+$/.test(pathname);

  const readInitialTab = (): TabType => {
    const params = new URLSearchParams(queryString);
    const raw = params.get("tab");

    if (isOwnProfile) {
      if (raw === "skills" || raw === "stars" || raw === "dashboard") return raw;
      if (raw === "overview") return "dashboard";
      return "dashboard";
    }

    if (raw === "skills") return "skills";
    return "overview";
  };

  const [activeTab, setActiveTab] = useState<TabType>(readInitialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [editHandle, setEditHandle] = useState((user as any)?.handle || "");
  const [editBio, setEditBio] = useState((user as any)?.bio || "");
  const [editProfileImageUrl, setEditProfileImageUrl] = useState<string | null>((user as any)?.profileImageUrl || null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setActiveTab(readInitialTab());
  }, [queryString, isOwnProfile]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/users", handle],
    queryFn: async () => {
      const res = await fetch(`/api/users/${handle}`);
      if (!res.ok) throw new Error("User not found");
      return res.json();
    },
    enabled: !!handle,
  });

  const { data: starredSkills = [] } = useQuery({
    queryKey: ["/api/my-stars"],
    queryFn: async () => {
      const res = await fetch("/api/my-stars", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOwnProfile,
  });

  const displayProfile = profile || (isOwnProfile ? user : null);

  useEffect(() => {
    if (!displayProfile || !isOwnProfile) return;
    setEditHandle((displayProfile as any).handle || "");
    setEditBio((displayProfile as any).bio || "");
    setEditProfileImageUrl((displayProfile as any).profileImageUrl || null);
  }, [displayProfile, isOwnProfile]);

  const publishedSkills = useMemo(() => {
    const skills = Array.isArray(profile?.skills) ? profile.skills : [];
    return [...skills].sort((a: any, b: any) => {
      const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bDate - aDate;
    });
  }, [profile?.skills]);

  const totalSkills = publishedSkills.length;
  const totalStars = publishedSkills.reduce((sum: number, skill: any) => sum + (skill.stars || 0), 0);
  const totalDownloads = publishedSkills.reduce((sum: number, skill: any) => sum + (skill.downloads || 0), 0);
  const dashboardSkills = publishedSkills.slice(0, 6);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const nextHandle = editHandle.trim();
      const nextBio = editBio.trim();
      const payload: Record<string, unknown> = { handle: nextHandle, bio: nextBio };

      if (FRONTEND_ONLY_PREVIEW) {
        payload.profileImageUrl = editProfileImageUrl;
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      return res.json();
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: FRONTEND_ONLY_PREVIEW && editProfileImageUrl ? "Your profile details and preview avatar were saved." : "Your profile details were saved.",
      });

      if (isOwnProfile && editHandle.trim() && pathname !== "/profile") {
        navigate(`/users/${editHandle.trim()}`);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const seoDisplayName = displayProfile?.firstName
    ? `${displayProfile.firstName} ${displayProfile.lastName || ""}`.trim()
    : displayProfile?.handle ||
      ((user as any)?.firstName
        ? `${(user as any).firstName} ${(user as any).lastName || ""}`.trim()
        : handle || "Profile");
  const seoBio = typeof displayProfile?.bio === "string" ? displayProfile.bio.trim() : "";

  usePageSeo({
    title: isPublicProfileRoute ? seoDisplayName : "My Profile",
    description: toMetaDescription(
      isPublicProfileRoute
        ? seoBio
          ? `${seoBio} Explore published TraderClaw Skills, profile details, and registry activity from ${seoDisplayName}.`
          : `Explore published TraderClaw Skills, profile details, and registry activity from ${seoDisplayName}.`
        : "Manage your TraderClaw Skills profile, published work, starred skills, and registry activity from your account page.",
    ),
    canonicalPath: isPublicProfileRoute && handle ? `/users/${handle}` : "/profile",
    robots: isPublicProfileRoute && activeTab === "overview" ? "index,follow" : "noindex,follow",
  });

  if (isLoading) {
    return <RouteLoader label="Loading profile" />;
  }

  if (!displayProfile) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">User not found</h1>
      </div>
    );
  }

  const displayName = displayProfile.firstName
    ? `${displayProfile.firstName} ${displayProfile.lastName || ""}`.trim()
    : displayProfile.handle || "Anonymous";
  const avatarSrc = isEditing ? editProfileImageUrl || undefined : displayProfile.profileImageUrl || undefined;
  const avatarFallback = getInitials(displayName, displayProfile.handle?.[0]?.toUpperCase() || "U");
  const bioLength = editBio.length;

  const tabs = isOwnProfile
    ? [
        { id: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
        { id: "skills" as const, label: "My Skills", icon: Package, count: totalSkills },
        { id: "stars" as const, label: "Starred", icon: Star, count: starredSkills.length },
      ]
    : [
        { id: "overview" as const, label: "Overview", icon: BarChart3 },
        { id: "skills" as const, label: "Skills", icon: Package, count: totalSkills },
      ];

  const statCards = [
    {
      label: "Total Skills",
      value: numberFormatter.format(totalSkills),
      helper: "Published in the registry",
      icon: Package,
    },
    {
      label: "Total Stars",
      value: numberFormatter.format(totalStars),
      helper: "Across published skills",
      icon: Star,
    },
    {
      label: "Total Downloads",
      value: numberFormatter.format(totalDownloads),
      helper: "All-time package installs",
      icon: Download,
    },
  ];

  const startEditing = () => {
    setEditHandle((displayProfile as any).handle || "");
    setEditBio((displayProfile as any).bio || "");
    setEditProfileImageUrl((displayProfile as any).profileImageUrl || null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditHandle((displayProfile as any).handle || "");
    setEditBio((displayProfile as any).bio || "");
    setEditProfileImageUrl((displayProfile as any).profileImageUrl || null);
    setIsEditing(false);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(queryString);
    const defaultTab = isOwnProfile ? "dashboard" : "overview";

    if (tab === defaultTab) nextParams.delete("tab");
    else nextParams.set("tab", tab);

    const nextQuery = nextParams.toString();
    navigate(`${pathname}${nextQuery ? `?${nextQuery}` : ""}`);
  };

  const handleAvatarButtonClick = () => {
    if (!isOwnProfile) return;

    if (!FRONTEND_ONLY_PREVIEW) {
      toast({
        title: "Avatar upload unavailable",
        description: "This backend does not support profile-image uploads yet. Your current photo comes from your connected account.",
      });
      return;
    }

    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid image", description: "Choose a PNG, JPG, WebP, or SVG image.", variant: "destructive" });
      return;
    }

    if (file.size > AVATAR_FILE_MAX_BYTES) {
      toast({ title: "Image too large", description: "Profile images must be 3 MB or smaller.", variant: "destructive" });
      return;
    }

    try {
      const nextImageUrl = await readFileAsDataUrl(file);
      setEditProfileImageUrl(nextImageUrl);
      setIsEditing(true);
      toast({
        title: "Profile photo ready",
        description: "Save your profile to apply the new avatar in preview mode.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unable to load that image.",
        variant: "destructive",
      });
    }
  };

  const renderSkillGrid = (
    skills: any[],
    emptyTitle: string,
    emptyDescription: string,
    actionHref?: string,
    actionLabel?: string,
  ) => {
    if (skills.length > 0) {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {skills.map((skill: any) => (
            <SkillCard
              key={skill.id}
              skill={{
                ...skill,
                owner: skill.owner || {
                  id: displayProfile.id,
                  handle: displayProfile.handle,
                  firstName: displayProfile.firstName,
                  lastName: displayProfile.lastName,
                  profileImageUrl: displayProfile.profileImageUrl,
                },
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <Card className="border-border/80 bg-card/65">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
          <div className="flex h-16 w-16 items-center justify-center border border-primary/18 bg-primary/8 text-primary">
            <Package className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl text-foreground">{emptyTitle}</h3>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
          </div>
          {actionHref && actionLabel ? (
            <Button asChild>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      <Button
        variant="ghost"
        size="sm"
        className="mb-5 gap-2"
        onClick={() => window.history.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <Card className="border-border/80 bg-card/70">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-col items-center gap-4 xl:items-start">
                <div className="group relative">
                  <Avatar className="h-40 w-40 border border-border/80 bg-card shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:h-48 sm:w-48">
                    <AvatarImage src={avatarSrc} alt={displayName} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-4xl text-primary sm:text-5xl">
                      {avatarFallback}
                    </AvatarFallback>
                  </Avatar>

                  {isOwnProfile ? (
                    <>
                      <button
                        type="button"
                        onClick={handleAvatarButtonClick}
                        className="absolute inset-0 flex items-end justify-end bg-black/0 opacity-0 transition-[background-color,opacity] duration-200 ease-out hover:bg-black/35 group-hover:opacity-100"
                        aria-label="Upload profile image"
                      >
                        <span
                          className="mb-3 mr-3 inline-flex items-center gap-2 border border-primary/24 bg-black/70 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-foreground backdrop-blur-sm"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Upload
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAvatarButtonClick}
                        className="absolute bottom-3 right-3 inline-flex h-11 w-11 items-center justify-center border border-primary/24 bg-black/75 text-primary backdrop-blur-sm transition-[transform,background-color,border-color,color] duration-200 ease-out hover:-translate-y-[1px] hover:border-primary/38 hover:bg-black/88 hover:text-foreground"
                        aria-label="Change profile image"
                      >
                        <Upload className="h-4 w-4" />
                      </button>
                    </>
                  ) : null}
                </div>

                <div className="space-y-2 text-center xl:text-left">
                  <div>
                    <h1 className="text-3xl text-foreground sm:text-4xl">{displayName}</h1>
                    {displayProfile.handle ? (
                      <p className="mt-1 text-sm text-muted-foreground sm:text-base">@{displayProfile.handle}</p>
                    ) : null}
                  </div>
                  <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                    {displayProfile.bio || "No public bio yet."}
                  </p>
                </div>
              </div>

              <div className="section-divider" />

              <div className="space-y-3 text-sm text-muted-foreground">
                {displayProfile.createdAt ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>
                      Joined{" "}
                      {new Date(displayProfile.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                ) : null}
                {isOwnProfile && FRONTEND_ONLY_PREVIEW ? (
                  <p className="text-xs leading-5 text-muted-foreground">
                    Avatar uploads are available in frontend-only preview mode and save with your profile here.
                  </p>
                ) : null}
              </div>

              {isEditing ? (
                <div className="space-y-4 border-t border-border/80 pt-5">
                  <div className="space-y-2">
                    <Label htmlFor="profile-username">Username</Label>
                    <Input
                      id="profile-username"
                      value={editHandle}
                      onChange={(event) => setEditHandle(event.target.value)}
                      placeholder="your-username"
                    />
                    <p className="text-xs leading-5 text-muted-foreground">
                      Your public username appears in your profile URL and skill URLs.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="profile-bio">Bio</Label>
                      <span
                        className="inline-flex items-center border border-border/70 bg-background/70 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {bioLength}/{BIO_MAX_LENGTH}
                      </span>
                    </div>
                    <div className="relative">
                      <Textarea
                        id="profile-bio"
                        value={editBio}
                        onChange={(event) => setEditBio(event.target.value)}
                        placeholder="Tell the TraderClaw community a little about yourself..."
                        rows={5}
                        maxLength={BIO_MAX_LENGTH}
                        className="min-h-[140px] pr-4"
                      />
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Keep it short and clear. This appears on your public profile.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateMutation.mutate()}
                      disabled={updateMutation.isPending}
                      className="flex-1"
                    >
                      {updateMutation.isPending ? "Saving..." : "Save Profile"}
                    </Button>
                    <Button variant="outline" onClick={cancelEditing} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : isOwnProfile ? (
                <Button variant="outline" className="w-full" onClick={startEditing}>
                  Edit Profile
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0 space-y-5">
          <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as TabType)} className="space-y-5">
            <TabsList className="w-full justify-start overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="min-w-fit">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count !== undefined ? (
                      <span className="ml-1 inline-flex min-w-[1.5rem] items-center justify-center border border-border/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {numberFormatter.format(tab.count)}
                      </span>
                    ) : null}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={isOwnProfile ? "dashboard" : "overview"} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                {statCards.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label} className="border-border/80 bg-card/70">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-3">
                            <p
                              className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                              style={{ fontFamily: "var(--font-mono)" }}
                            >
                              {stat.label}
                            </p>
                            <div className="text-3xl text-foreground">{stat.value}</div>
                            <p className="text-sm leading-6 text-muted-foreground">{stat.helper}</p>
                          </div>
                          <div className="flex h-11 w-11 items-center justify-center border border-primary/14 bg-primary/8 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="border-border/80 bg-card/70">
                <CardHeader className="pb-4">
                  <CardTitle>{isOwnProfile ? "Your Skills" : "Published Skills"}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {renderSkillGrid(
                    dashboardSkills,
                    isOwnProfile ? "No Skills Yet" : "No Skills Published Yet",
                    isOwnProfile
                      ? "Create your first TraderClaw skill to start building out your profile workspace."
                      : `${displayName} has not published any skills yet.`,
                    isOwnProfile ? "/new" : undefined,
                    isOwnProfile ? "Create First Skill" : undefined,
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills" className="space-y-5">
              <Card className="border-border/80 bg-card/70">
                <CardHeader className="pb-4">
                  <CardTitle>{isOwnProfile ? "My Skills" : "Skills"}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {renderSkillGrid(
                    publishedSkills,
                    isOwnProfile ? "No Skills Yet" : "No Skills Published Yet",
                    isOwnProfile
                      ? "You have not published any skills yet. Start a new one and it will appear here."
                      : `${displayName} has not published any skills yet.`,
                    isOwnProfile ? "/new" : undefined,
                    isOwnProfile ? "Create First Skill" : undefined,
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {isOwnProfile ? (
              <TabsContent value="stars" className="space-y-5">
                <Card className="border-border/80 bg-card/70">
                  <CardHeader className="pb-4">
                    <CardTitle>Starred Skills</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {renderSkillGrid(
                      starredSkills,
                      "No Starred Skills Yet",
                      "Star skills from the registry and they will show up here for quick access.",
                      "/browse",
                      "Browse Skills",
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ) : null}
          </Tabs>
        </section>
      </div>
    </div>
  );
}
