import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SkillCard from "@/components/SkillCard";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Package, Star, BookOpen, MapPin, Link as LinkIcon, Calendar, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "overview" | "skills" | "stars";

export default function Profile() {
  const [, usersParams] = useRoute("/users/:handle");
  const [, uParams] = useRoute("/u/:handle");
  const params = usersParams || uParams;
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();

  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const tabFromUrl = urlParams.get("tab") as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl || "overview");

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const isOwnProfile = !params?.handle || params?.handle === (user as any)?.handle || params?.handle === "me";
  const handle = params?.handle === "me" ? (user as any)?.handle : params?.handle;

  const [isEditing, setIsEditing] = useState(false);
  const [editHandle, setEditHandle] = useState((user as any)?.handle || "");
  const [editBio, setEditBio] = useState((user as any)?.bio || "");

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
    enabled: isOwnProfile && activeTab === "stars",
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ handle: editHandle, bio: editBio }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", handle] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
      toast({ title: "Profile updated!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const displayProfile = profile || (isOwnProfile ? user : null);
  if (!displayProfile) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">User not found</h1>
      </div>
    );
  }

  const displayName = displayProfile.firstName
    ? `${displayProfile.firstName} ${displayProfile.lastName || ""}`.trim()
    : displayProfile.handle || "Anonymous";

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BookOpen },
    { id: "skills" as const, label: "Skills", icon: Package, count: profile?.skills?.length || 0 },
    { id: "stars" as const, label: "Stars", icon: Star, count: isOwnProfile ? starredSkills.length : undefined },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "skills":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Skills</h2>
            {profile?.skills && profile.skills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.skills.map((skill: any) => (
                  <SkillCard
                    key={skill.id}
                    skill={{
                      ...skill,
                      owner: {
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
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No skills published yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "stars":
        if (!isOwnProfile) {
          return (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Starred skills are private.</p>
              </CardContent>
            </Card>
          );
        }
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Starred Skills</h2>
            {starredSkills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {starredSkills.map((skill: any) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No starred skills yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {profile?.skills && profile.skills.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Popular Skills</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.skills.slice(0, 4).map((skill: any) => (
                    <SkillCard
                      key={skill.id}
                      skill={{
                        ...skill,
                        owner: {
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
              </div>
            )}
            {(!profile?.skills || profile.skills.length === 0) && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{displayName} hasn't published any skills yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Button 
        variant="ghost" 
        size="sm" 
        className="gap-2 mb-4" 
        onClick={() => window.history.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-72 space-y-4">
          <Avatar className="h-64 w-64 mx-auto md:mx-0 rounded-full border-4 border-background shadow-lg">
            <AvatarImage src={displayProfile.profileImageUrl || undefined} />
            <AvatarFallback className="text-6xl">{displayName[0]}</AvatarFallback>
          </Avatar>
          
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Handle</Label>
                <Input
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  placeholder="your-handle"
                />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="flex-1">
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-bold">{displayName}</h1>
                {displayProfile.handle && (
                  <p className="text-xl text-muted-foreground">@{displayProfile.handle}</p>
                )}
              </div>
              
              {displayProfile.bio && (
                <p className="text-muted-foreground">{displayProfile.bio}</p>
              )}
              
              {isOwnProfile && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEditHandle((user as any)?.handle || "");
                    setEditBio((user as any)?.bio || "");
                    setIsEditing(true);
                  }}
                >
                  Edit profile
                </Button>
              )}
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(displayProfile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex-1">
          <div className="border-b mb-6">
            <nav className="flex gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 py-3 px-1 border-b-2 -mb-px text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-muted text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
