export interface User {
  id: string;
  email: string | null;
  password_hash: string | null;
  email_verified: boolean;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  handle: string | null;
  bio: string | null;
  openai_api_key: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export type UpsertUser = Partial<User> & { id?: string };

export interface AuthIdentity {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  provider_data: Record<string, any> | null;
  created_at: string;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface EmailVerificationToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface ApiToken {
  id: string;
  user_id: string;
  name: string;
  token: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  is_revoked: boolean;
  created_at: string;
}

export type InsertApiToken = Omit<ApiToken, "id" | "created_at" | "is_revoked"> & {
  id?: string;
  is_revoked?: boolean;
};
