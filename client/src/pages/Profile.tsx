import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SkillCard from "@/components/SkillCard";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const [, params] = useRoute("/u/:handle");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isOwnProfile = !params?.handle;
  const handle = params?.handle || user?.id;

  const [isEditing, setIsEditing] = useState(false);
  const [editHandle, setEditHandle] = useState(user?.handle || "");
  const [editBio, setEditBio] = useState(user?.bio || "");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/users", handle],
    queryFn: async () => {
      const res = await fetch(`/api/users/${handle}`);
      if (!res.ok) throw new Error("User not found");
      return res.json();
    },
    enabled: !!handle,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage src={displayProfile.profileImageUrl || undefined} />
              <AvatarFallback className="text-2xl">{displayName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
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
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold">{displayName}</h1>
                  {displayProfile.handle && (
                    <p className="text-muted-foreground">@{displayProfile.handle}</p>
                  )}
                  {displayProfile.bio && <p className="mt-2">{displayProfile.bio}</p>}
                  <p className="text-sm text-muted-foreground mt-2">
                    Joined {new Date(displayProfile.createdAt).toLocaleDateString()}
                  </p>
                  {isOwnProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setEditHandle(user?.handle || "");
                        setEditBio(user?.bio || "");
                        setIsEditing(true);
                      }}
                    >
                      Edit Profile
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-xl font-semibold mb-4">
          {isOwnProfile ? "My Skills" : `${displayName}'s Skills`}
        </h2>
        {profile?.skills && profile.skills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              No skills published yet.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
