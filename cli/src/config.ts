import Conf from "conf";

interface ConfigSchema {
  token?: string;
  apiUrl: string;
  user?: {
    id: string;
    handle: string;
    firstName?: string;
    lastName?: string;
  };
}

export const config = new Conf<ConfigSchema>({
  projectName: "skillbook-cli",
  defaults: {
    apiUrl: "https://skillbook.replit.app",
  },
});

export function getToken(): string | undefined {
  return config.get("token");
}

export function setToken(token: string): void {
  config.set("token", token);
}

export function clearToken(): void {
  config.delete("token");
  config.delete("user");
}

export function getApiUrl(): string {
  return config.get("apiUrl");
}

export function setApiUrl(url: string): void {
  config.set("apiUrl", url);
}

export function getUser(): ConfigSchema["user"] | undefined {
  return config.get("user");
}

export function setUser(user: ConfigSchema["user"]): void {
  config.set("user", user);
}
