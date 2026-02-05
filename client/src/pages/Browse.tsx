import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SkillCard from "@/components/SkillCard";
import { Search, Package, AlertCircle, RefreshCw } from "lucide-react";

export default function Browse() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");

  const { data: skills = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/skills", search, sort],
    queryFn: async () => {
      const params = new URLSearchParams({ sort, limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/skills?${params}`);
      if (!res.ok) {
        throw new Error("Failed to load skills. Please try again.");
      }
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Browse Skills</h1>
          <p className="text-muted-foreground">Discover skills for your OpenClaw agents</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={sort === "latest" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("latest")}
          >
            Latest
          </Button>
          <Button
            variant={sort === "stars" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("stars")}
          >
            Popular
          </Button>
          <Button
            variant={sort === "downloads" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("downloads")}
          >
            Most Downloaded
          </Button>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to load skills</h3>
            <p className="text-muted-foreground mb-4">
              Something went wrong. Please try again.
            </p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-6 bg-muted rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-muted rounded mb-4 w-full"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : skills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill: any) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-20 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No skills found</h3>
            <p className="text-muted-foreground">
              {search ? `No skills match "${search}"` : "No skills have been published yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
