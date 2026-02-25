import { Express, Request, Response, NextFunction } from "express";
import { db } from "./db.js";
import { users, authIdentities, passwordResetTokens, emailVerificationTokens } from "../shared/schema.js";
import { eq, and, or } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 12;

function getBaseUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "skillhub.space";
  return `${proto}://${host}`;
}

// Generate secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Password validation
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

// Handle validation
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

// Email validation
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Session-based authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.userId) {
    return next();
  }
  return res.status(401).json({ message: "Authentication required" });
}

// Get current user from session
export async function getCurrentUser(req: Request): Promise<any> {
  const userId = (req.session as any)?.userId;
  if (!userId) return null;
  
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user || null;
}

export function setupAuthRoutes(app: Express) {
  // Get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { passwordHash, openaiApiKey, ...safeUser } = user;
      res.json({ 
        ...safeUser, 
        hasOpenaiKey: !!openaiApiKey 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Register with email/password
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, handle, firstName, lastName } = req.body;

      // Validate inputs
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

      // Check if email already exists
      const [existingEmail] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Check if handle already exists
      const [existingHandle] = await db.select().from(users).where(eq(users.handle, handle.toLowerCase())).limit(1);
      if (existingHandle) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const [newUser] = await db.insert(users).values({
        email: email.toLowerCase(),
        passwordHash,
        handle: handle.toLowerCase(),
        firstName,
        lastName,
        emailVerified: false,
      }).returning();

      // Create auth identity
      await db.insert(authIdentities).values({
        userId: newUser.id,
        provider: "email",
        providerUserId: email.toLowerCase(),
      });

      // Set session
      (req.session as any).userId = newUser.id;

      const { passwordHash: _, openaiApiKey, ...safeUser } = newUser;
      res.json({ user: safeUser, message: "Registration successful" });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login with email/password
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session
      (req.session as any).userId = user.id;

      const { passwordHash, openaiApiKey, ...safeUser } = user;
      res.json({ user: { ...safeUser, hasOpenaiKey: !!openaiApiKey } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Request password reset
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email required" });
      }

      const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ message: "If an account exists, a reset link will be sent" });
      }

      // Generate reset token
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      // In production, send email here
      console.log(`Password reset token for ${email}: ${token}`);
      
      res.json({ message: "If an account exists, a reset link will be sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // Reset password with token
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

      // Find valid token
      const [resetToken] = await db.select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token))
        .limit(1);

      if (!resetToken || resetToken.usedAt || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Update user password
      await db.update(users).set({ passwordHash }).where(eq(users.id, resetToken.userId));

      // Mark token as used
      await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, resetToken.id));

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Google OAuth - redirect to Google
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

  // Google OAuth callback
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

      // Exchange code for tokens
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

      // Get user info from Google
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const googleUser = await userInfoResponse.json();
      console.log("OAuth user info:", googleUser.email, "id:", googleUser.id);

      // Check if identity already exists
      const [existingIdentity] = await db.select()
        .from(authIdentities)
        .where(and(eq(authIdentities.provider, "google"), eq(authIdentities.providerUserId, googleUser.id)))
        .limit(1);

      let userId: string;

      if (existingIdentity) {
        userId = existingIdentity.userId;
      } else {
        // Check if user with same email exists
        const [existingUser] = await db.select().from(users).where(eq(users.email, googleUser.email.toLowerCase())).limit(1);
        
        if (existingUser) {
          // Link Google to existing account
          await db.insert(authIdentities).values({
            userId: existingUser.id,
            provider: "google",
            providerUserId: googleUser.id,
            providerData: googleUser,
          });
          userId = existingUser.id;
        } else {
          // Create new user
          const handle = googleUser.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]/g, "") || `user${Date.now()}`;
          
          const [newUser] = await db.insert(users).values({
            email: googleUser.email.toLowerCase(),
            firstName: googleUser.given_name,
            lastName: googleUser.family_name,
            profileImageUrl: googleUser.picture,
            handle,
            emailVerified: true,
          }).returning();

          await db.insert(authIdentities).values({
            userId: newUser.id,
            provider: "google",
            providerUserId: googleUser.id,
            providerData: googleUser,
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

  // Update OpenAI API key
  app.put("/api/auth/openai-key", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const { apiKey } = req.body;

      if (!apiKey) {
        // Remove key
        await db.update(users).set({ openaiApiKey: null }).where(eq(users.id, userId));
        return res.json({ message: "API key removed" });
      }

      // Validate key format
      if (!apiKey.startsWith("sk-")) {
        return res.status(400).json({ message: "Invalid OpenAI API key format" });
      }

      await db.update(users).set({ openaiApiKey: apiKey }).where(eq(users.id, userId));
      res.json({ message: "API key saved" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save API key" });
    }
  });
}
