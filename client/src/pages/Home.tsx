import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SkillCard from "@/components/SkillCard";
import { Plus, Package, Star, TrendingUp, Flame } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) return { skills: 0, versions: 0, users: 0 };
      return res.json();
    },
  });

  const { data: trendingSkills = [], isLoading: trendingLoading } = useQuery({
    queryKey: ["/api/skills/trending"],
    queryFn: async () => {
      const res = await fetch("/api/skills/trending?limit=6");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: latestSkills = [], isLoading: latestLoading } = useQuery({
    queryKey: ["/api/skills", "latest"],
    queryFn: async () => {
      const res = await fetch("/api/skills?sort=latest&limit=6");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: popularSkills = [], isLoading: popularLoading } = useQuery({
    queryKey: ["/api/skills", "popular"],
    queryFn: async () => {
      const res = await fetch("/api/skills?sort=stars&limit=6");
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.firstName || "Developer"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover and share OpenClaw skills with the community.
          </p>
        </div>
        <Link href="/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Skill
          </Button>
        </Link>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold">{stats?.skills || 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Skills</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Star className="h-6 w-6 text-green-500" />
              </div>
              <div>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold">{stats?.versions || 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Versions Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold">{stats?.downloads || 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {trendingSkills.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Trending This Week
            </h2>
          </div>
          {trendingLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-6 bg-muted rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-muted rounded mb-4 w-full"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingSkills.map((skill: any) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Latest Skills</h2>
          <Link href="/browse?sort=latest">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        {latestLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-6 bg-muted rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-muted rounded mb-4 w-full"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestSkills.map((skill: any) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
            {latestSkills.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No skills yet. Be the first to publish one!</p>
                  <Link href="/new">
                    <Button className="mt-4">Create Skill</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Popular Skills</h2>
          <Link href="/browse?sort=stars">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        {popularLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-6 bg-muted rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-muted rounded mb-4 w-full"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularSkills.map((skill: any) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
