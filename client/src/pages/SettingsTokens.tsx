import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Trash2, Plus, AlertCircle } from "@/components/ui/icons";
import SettingsLayout from "@/components/SettingsLayout";
import { usePageSeo } from "@/lib/seo";

interface ApiToken {
  id: string;
  name: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function SettingsTokens() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tokenName, setTokenName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const cliInstallCommand = "npm install -g tcs";
  const cliAuthCommand = "tcs auth login --token YOUR_TOKEN";

  usePageSeo({
    title: "API Tokens",
    description:
      "Create, copy, and revoke TraderClaw Skills API tokens for CLI authentication and automated workflows.",
    canonicalPath: "/settings/tokens",
    robots: "noindex,nofollow",
  });

  const { data: tokens = [], isLoading: tokensLoading } = useQuery({
    queryKey: ["/api/tokens"],
    queryFn: async () => {
      const res = await fetch("/api/tokens", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tokens");
      return res.json();
    },
  });

  const createToken = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: tokenName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: (data) => {
      setNewToken(data.token);
      setTokenName("");
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
      toast({ title: "Token created", description: "Copy it now - you won't see it again!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const revokeToken = useMutation({
    mutationFn: async (tokenId: string) => {
      const res = await fetch(`/api/tokens/${tokenId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to revoke token");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
      toast({ title: "Token revoked" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const copyToken = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      toast({ title: "Copied!", description: "Token copied to clipboard" });
    }
  };

  const copyCliCommands = async () => {
    try {
      await navigator.clipboard.writeText(`${cliInstallCommand}\n${cliAuthCommand}`);
      toast({ title: "Copied!", description: "CLI commands copied to clipboard" });
    } catch (error) {
      toast({ title: "Copy failed", description: "Unable to copy the CLI commands.", variant: "destructive" });
    }
  };

  return (
    <SettingsLayout>
      <Card className="border-border/80 bg-card/70">
        <CardHeader>
          <CardTitle>API Tokens</CardTitle>
          <CardDescription>
            Create tokens to authenticate with the TraderClaw CLI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div
              className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              CLI Installation
            </div>
            <div className="tc-docs-terminal not-prose">
              <div className="tc-docs-terminal-bar">
                <span className="tc-docs-terminal-label">Terminal</span>
                <button
                  type="button"
                  onClick={copyCliCommands}
                  className="tc-docs-terminal-copy inline-flex items-center gap-2"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
              <pre>
                <code>{`${cliInstallCommand}\n${cliAuthCommand}`}</code>
              </pre>
            </div>
          </div>

          {newToken && (
            <div className="border border-profit/20 bg-profit/8 p-4 space-y-2">
              <div className="flex items-center gap-2 text-profit font-medium">
                <AlertCircle className="h-4 w-4" />
                New token created. Copy it now.
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 border border-profit/16 bg-background/80 p-2 text-sm font-mono break-all text-foreground">
                  {newToken}
                </code>
                <Button size="icon" variant="outline" onClick={copyToken}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This token will not be shown again. Store it securely.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Token name (e.g., My Laptop)"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              className="sm:flex-1"
            />
            <Button
              onClick={() => createToken.mutate()}
              disabled={!tokenName || createToken.isPending}
              className="gap-2 sm:min-w-[132px]"
            >
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </div>

          {tokensLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 border border-border/70 bg-muted/30"></div>
              ))}
            </div>
          ) : tokens.length > 0 ? (
            <div className="overflow-x-auto border border-border/80 bg-card/40">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border/80">
                    <th
                      className="px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      Name
                    </th>
                    <th
                      className="px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      Created
                    </th>
                    <th
                      className="px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      Last Used
                    </th>
                    <th
                      className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token: ApiToken) => (
                    <tr key={token.id} className="border-b border-border/70 last:border-b-0">
                      <td className="px-4 py-3.5 align-middle">
                        <div className="text-sm text-foreground">{token.name}</div>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-sm text-muted-foreground">
                        {new Date(token.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-sm text-muted-foreground">
                        {token.lastUsedAt
                          ? new Date(token.lastUsedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Never"}
                      </td>
                      <td className="px-4 py-3.5 text-right align-middle">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => revokeToken.mutate(token.id)}
                          disabled={revokeToken.isPending}
                          className="ml-auto"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No API tokens yet. Create one to use the CLI.
            </p>
          )}
        </CardContent>
      </Card>
    </SettingsLayout>
  );
}
