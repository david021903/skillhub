import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SkillCard from "@/components/SkillCard";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Package, AlertCircle, RefreshCw } from "lucide-react";

export default function MySkills() {
  const { user } = useAuth();

  const { data: skills = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/my-skills"],
    queryFn: async () => {
      const res = await fetch("/api/my-skills", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch skills");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Skills</h1>
          <p className="text-muted-foreground">Manage your published skills</p>
        </div>
        <Link href="/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Skill
          </Button>
        </Link>
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
      ) : skills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill: any) => (
            <SkillCard
              key={skill.id}
              skill={{
                ...skill,
                owner: {
                  id: user?.id || "",
                  handle: user?.handle,
                  firstName: user?.firstName,
                  lastName: user?.lastName,
                  profileImageUrl: user?.profileImageUrl,
                },
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-20 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No skills yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't published any skills yet. Create your first one!
            </p>
            <Link href="/new">
              <Button>Create Your First Skill</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
