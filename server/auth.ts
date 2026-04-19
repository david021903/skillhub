import { Express, Request, Response, NextFunction } from "express";
import { supabase } from "./db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 12;

function getBaseUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "skillhub.space";
  return `${proto}://${host}`;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain a lowercase letter" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain an uppercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain a number" };
  }
  return { valid: true };
}

function validateHandle(handle: string): { valid: boolean; message?: string } {
  if (!handle || handle.length < 3) {
    return { valid: false, message: "Username must be at least 3 characters" };
  }
  if (handle.length > 30) {
    return { valid: false, message: "Username must be at most 30 characters" };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
    return { valid: false, message: "Username can only contain letters, numbers, underscores, and hyphens" };
  }
  if (/^[-_]|[-_]$/.test(handle)) {
    return { valid: false, message: "Username cannot start or end with a hyphen or underscore" };
  }
  return { valid: true };
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.userId) {
    return next();
  }
  return res.status(401).json({ message: "Authentication required" });
}

export async function getCurrentUser(req: Request): Promise<any> {
  const userId = (req.session as any)?.userId;
  if (!userId) return null;

  const { data: user } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  return user || null;
}

export function setupAuthRoutes(app: Express) {
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { password_hash, openai_api_key, ...safeUser } = user;
      res.json({
        ...safeUser,
        hasOpenaiKey: !!openai_api_key,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, handle, firstName, lastName } = req.body;

      if (!email || !validateEmail(email)) {
        return res.status(400).json({ message: "Valid email is required" });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }

      const handleValidation = validateHandle(handle);
      if (!handleValidation.valid) {
        return res.status(400).json({ message: handleValidation.message });
      }

      const { data: existingEmail } = await supabase.from("users").select("id").eq("email", email.toLowerCase()).maybeSingle();
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const { data: existingHandle } = await supabase.from("users").select("id").eq("handle", handle.toLowerCase()).maybeSingle();
      if (existingHandle) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const { data: newUser, error } = await supabase.from("users").insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        handle: handle.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        email_verified: false,
      }).select().single();

      if (error) throw error;

      await supabase.from("auth_identities").insert({
        user_id: newUser.id,
        provider: "email",
        provider_user_id: email.toLowerCase(),
      });

      (req.session as any).userId = newUser.id;

      const { password_hash: _, openai_api_key, ...safeUser } = newUser;
      res.json({ user: safeUser, message: "Registration successful" });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const { data: user } = await supabase.from("users").select("*").eq("email", email.toLowerCase()).maybeSingle();
      if (!user || !user.password_hash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      (req.session as any).userId = user.id;

      const { password_hash, openai_api_key, ...safeUser } = user;
      res.json({ user: { ...safeUser, hasOpenaiKey: !!openai_api_key } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email required" });
      }

      const { data: user } = await supabase.from("users").select("id").eq("email", email.toLowerCase()).maybeSingle();

      if (!user) {
        return res.json({ message: "If an account exists, a reset link will be sent" });
      }

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await supabase.from("password_reset_tokens").insert({
        user_id: user.id,
        token,
        expires_at: expiresAt,
      });

      console.log(`Password reset token for ${email}: ${token}`);

      res.json({ message: "If an account exists, a reset link will be sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password required" });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }

      const { data: resetToken } = await supabase.from("password_reset_tokens").select("*").eq("token", token).maybeSingle();

      if (!resetToken || resetToken.used_at || new Date() > new Date(resetToken.expires_at)) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      await supabase.from("users").update({ password_hash: passwordHash }).eq("id", resetToken.user_id);

      await supabase.from("password_reset_tokens").update({ used_at: new Date().toISOString() }).eq("id", resetToken.id);

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.get("/api/auth/google", (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ message: "Google OAuth not configured" });
    }

    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    const scope = encodeURIComponent("openid email profile");
    const state = generateToken();

    (req.session as any).oauthState = state;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}&access_type=offline`;

    req.session.save((err) => {
      if (err) {
        console.error("Failed to save OAuth state to session:", err);
        return res.status(500).json({ message: "Session error" });
      }
      console.log("OAuth: redirecting to Google, state saved, redirectUri:", redirectUri);
      res.redirect(authUrl);
    });
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      const sessionState = (req.session as any).oauthState;

      console.log("OAuth callback: code exists:", !!code, "state match:", state === sessionState, "sessionState exists:", !!sessionState);

      if (!code || state !== sessionState) {
        console.error("OAuth state mismatch - state:", state, "sessionState:", sessionState, "sessionID:", req.sessionID);
        return res.redirect("/?error=auth_failed");
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `${getBaseUrl(req)}/api/auth/google/callback`;

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenResponse.json();
      console.log("OAuth token exchange status:", tokenResponse.status, "has access_token:", !!tokens.access_token);
      if (!tokens.access_token) {
        console.error("OAuth token exchange failed:", JSON.stringify(tokens));
        return res.redirect("/?error=auth_failed");
      }

      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const googleUser = await userInfoResponse.json();
      console.log("OAuth user info:", googleUser.email, "id:", googleUser.id);

      const { data: existingIdentity } = await supabase.from("auth_identities")
        .select("user_id")
        .eq("provider", "google")
        .eq("provider_user_id", googleUser.id)
        .maybeSingle();

      let userId: string;

      if (existingIdentity) {
        userId = existingIdentity.user_id;
      } else {
        const { data: existingUser } = await supabase.from("users").select("id").eq("email", googleUser.email.toLowerCase()).maybeSingle();

        if (existingUser) {
          await supabase.from("auth_identities").insert({
            user_id: existingUser.id,
            provider: "google",
            provider_user_id: googleUser.id,
            provider_data: googleUser,
          });
          userId = existingUser.id;
        } else {
          const handle = googleUser.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]/g, "") || `user${Date.now()}`;

          const { data: newUser, error } = await supabase.from("users").insert({
            email: googleUser.email.toLowerCase(),
            first_name: googleUser.given_name,
            last_name: googleUser.family_name,
            profile_image_url: googleUser.picture,
            handle,
            email_verified: true,
          }).select().single();

          if (error) throw error;

          await supabase.from("auth_identities").insert({
            user_id: newUser.id,
            provider: "google",
            provider_user_id: googleUser.id,
            provider_data: googleUser,
          });

          userId = newUser.id;
        }
      }

      (req.session as any).userId = userId;
      delete (req.session as any).oauthState;

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.redirect("/?error=auth_failed");
        }
        res.redirect("/");
      });
    } catch (error) {
      console.error("Google OAuth error:", error);
      res.redirect("/?error=auth_failed");
    }
  });

  app.get("/api/auth/github", (req: Request, res: Response) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ message: "GitHub OAuth not configured" });
    }

    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/auth/github/callback`;
    const scope = "user:email";
    const state = generateToken();

    (req.session as any).oauthState = state;

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

    req.session.save((err) => {
      if (err) {
        console.error("Failed to save GitHub OAuth state to session:", err);
        return res.status(500).json({ message: "Session error" });
      }
      res.redirect(authUrl);
    });
  });

  app.get("/api/auth/github/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      const sessionState = (req.session as any).oauthState;

      if (!code || state !== sessionState) {
        console.error("GitHub OAuth state mismatch");
        return res.redirect("/?error=auth_failed");
      }

      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: code as string,
        }),
      });

      const tokens = await tokenResponse.json();
      if (!tokens.access_token) {
        console.error("GitHub token exchange failed:", JSON.stringify(tokens));
        return res.redirect("/?error=auth_failed");
      }

      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Accept": "application/json",
        },
      });
      const githubUser = await userResponse.json();

      let email = githubUser.email;
      if (!email) {
        const emailsResponse = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "Accept": "application/json",
          },
        });
        const emails = await emailsResponse.json();
        const primary = emails.find((e: any) => e.primary && e.verified);
        email = primary?.email || emails[0]?.email;
      }

      if (!email) {
        return res.redirect("/?error=no_email");
      }

      const githubId = String(githubUser.id);

      const { data: existingIdentity } = await supabase.from("auth_identities")
        .select("user_id")
        .eq("provider", "github")
        .eq("provider_user_id", githubId)
        .maybeSingle();

      let userId: string;

      if (existingIdentity) {
        userId = existingIdentity.user_id;
      } else {
        const { data: existingUser } = await supabase.from("users").select("id").eq("email", email.toLowerCase()).maybeSingle();

        if (existingUser) {
          await supabase.from("auth_identities").insert({
            user_id: existingUser.id,
            provider: "github",
            provider_user_id: githubId,
            provider_data: githubUser,
          });
          userId = existingUser.id;
        } else {
          const handle = (githubUser.login || email.split("@")[0]).toLowerCase().replace(/[^a-z0-9_-]/g, "") || `user${Date.now()}`;
          const nameParts = (githubUser.name || "").split(" ");

          const { data: newUser, error } = await supabase.from("users").insert({
            email: email.toLowerCase(),
            first_name: nameParts[0] || null,
            last_name: nameParts.slice(1).join(" ") || null,
            profile_image_url: githubUser.avatar_url,
            handle,
            email_verified: true,
          }).select().single();

          if (error) throw error;

          await supabase.from("auth_identities").insert({
            user_id: newUser.id,
            provider: "github",
            provider_user_id: githubId,
            provider_data: githubUser,
          });

          userId = newUser.id;
        }
      }

      (req.session as any).userId = userId;
      delete (req.session as any).oauthState;

      req.session.save((err) => {
        if (err) {
          console.error("GitHub session save error:", err);
          return res.redirect("/?error=auth_failed");
        }
        res.redirect("/");
      });
    } catch (error) {
      console.error("GitHub OAuth error:", error);
      res.redirect("/?error=auth_failed");
    }
  });

  app.put("/api/auth/openai-key", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const { apiKey } = req.body;

      if (!apiKey) {
        await supabase.from("users").update({ openai_api_key: null }).eq("id", userId);
        return res.json({ message: "API key removed" });
      }

      if (!apiKey.startsWith("sk-")) {
        return res.status(400).json({ message: "Invalid OpenAI API key format" });
      }

      await supabase.from("users").update({ openai_api_key: apiKey }).eq("id", userId);
      res.json({ message: "API key saved" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save API key" });
    }
  });
}
