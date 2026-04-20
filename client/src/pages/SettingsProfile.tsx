import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import SettingsLayout from "@/components/SettingsLayout";
import { usePageSeo } from "@/lib/seo";
import { FRONTEND_ONLY_PREVIEW } from "@/lib/frontend-only";
import { Upload } from "@/components/ui/icons";

const BIO_MAX_LENGTH = 500;
const AVATAR_FILE_MAX_BYTES = 3 * 1024 * 1024;

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

export default function SettingsProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  usePageSeo({
    title: "Profile Settings",
    description:
      "Update your TraderClaw Skills profile details, public username, and bio from the account settings area.",
    canonicalPath: "/settings",
    robots: "noindex,nofollow",
  });

  useEffect(() => {
    if (user) {
      setHandle((user as any).handle || "");
      setBio((user as any).bio || "");
      setProfileImageUrl((user as any).profileImageUrl || null);
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { handle, bio };
      if (FRONTEND_ONLY_PREVIEW) {
        payload.profileImageUrl = profileImageUrl;
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
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description:
          FRONTEND_ONLY_PREVIEW && profileImageUrl
            ? "Your public profile details and preview avatar were saved."
            : "Your public profile details were saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email?.split("@")[0] || "User";
  const avatarFallback = getInitials(displayName, user?.email?.[0]?.toUpperCase() || "U");

  const handleAvatarButtonClick = () => {
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
      setProfileImageUrl(nextImageUrl);
      toast({
        title: "Profile photo ready",
        description: "Save your profile to apply the new avatar.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unable to load that image.",
        variant: "destructive",
      });
    }
  };

  return (
    <SettingsLayout>
      <Card>
        <CardHeader>
          <CardTitle>Public Profile</CardTitle>
          <CardDescription>Update your public profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFileChange}
          />

          <div className="border border-border/80 bg-card/60 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="group relative w-fit">
                <Avatar className="h-24 w-24 border border-border/80 bg-card shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
                  <AvatarImage src={profileImageUrl || undefined} alt={displayName} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>

                <button
                  type="button"
                  onClick={handleAvatarButtonClick}
                  className="absolute inset-0 flex items-end justify-end bg-black/0 opacity-0 transition-[background-color,opacity] duration-200 ease-out hover:bg-black/35 group-hover:opacity-100"
                  aria-label="Change profile image"
                >
                  <span className="mb-2 mr-2 inline-flex h-9 w-9 items-center justify-center border border-primary/24 bg-black/75 text-primary backdrop-blur-sm transition-[transform,background-color,border-color,color] duration-200 ease-out hover:-translate-y-[1px] hover:border-primary/38 hover:bg-black/88 hover:text-foreground">
                    <Upload className="h-4 w-4" />
                  </span>
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <Label className="text-sm text-foreground">Profile Image</Label>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    This image appears on your public profile and next to your published skills.
                  </p>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {FRONTEND_ONLY_PREVIEW
                    ? "Uploads are available in frontend-only preview mode and save with your profile here."
                    : "Live avatar uploads are not supported by this backend yet. Your current photo comes from your connected account."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="handle">Username</Label>
            <Input
              id="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="your-username"
            />
            <p className="text-xs text-muted-foreground">
              Your unique username. 3-30 characters, letters, numbers, underscores, or hyphens.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="bio">Bio</Label>
              <span
                className="inline-flex items-center border border-border/70 bg-background/70 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {bio.length}/{BIO_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              rows={4}
              maxLength={BIO_MAX_LENGTH}
              className="min-h-[140px]"
            />
            <p className="text-xs text-muted-foreground">Keep it short and clear. This appears on your public profile.</p>
          </div>
          <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>
    </SettingsLayout>
  );
}
