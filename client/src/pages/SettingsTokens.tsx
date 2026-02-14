import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Key, Copy, Trash2, Plus, Terminal, AlertCircle } from "lucide-react";
import SettingsLayout from "@/components/SettingsLayout";

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

  return (
    <SettingsLayout>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Tokens
          </CardTitle>
          <CardDescription>
            Create tokens to authenticate with the SkillHub CLI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Terminal className="h-4 w-4" />
              CLI Installation
            </div>
            <code className="text-sm block">npm install -g shsc</code>
            <code className="text-sm block text-muted-foreground">shsc auth login --token YOUR_TOKEN</code>
          </div>

          {newToken && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
                <AlertCircle className="h-4 w-4" />
                New token created - copy it now!
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-white dark:bg-black p-2 rounded border font-mono break-all">
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

          <div className="flex gap-2">
            <Input
              placeholder="Token name (e.g., My Laptop)"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
            />
            <Button
              onClick={() => createToken.mutate()}
              disabled={!tokenName || createToken.isPending}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </div>

          {tokensLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          ) : tokens.length > 0 ? (
            <div className="space-y-2">
              {tokens.map((token: ApiToken) => (
                <div key={token.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{token.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(token.createdAt).toLocaleDateString()}
                      {token.lastUsedAt && ` · Last used ${new Date(token.lastUsedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => revokeToken.mutate(token.id)}
                    disabled={revokeToken.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
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
