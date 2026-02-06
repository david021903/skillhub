import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import SkillCard from "@/components/SkillCard";
import { Star, Package } from "lucide-react";

export default function Starred() {
  const { data: starredSkills = [], isLoading, error } = useQuery({
    queryKey: ["/api/my-stars"],
    queryFn: async () => {
      const res = await fetch("/api/my-stars");
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error("Failed to fetch starred skills");
      }
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Star className="h-6 w-6 text-yellow-500" />
          <h1 className="text-2xl font-bold">Starred Skills</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Star className="h-6 w-6 text-yellow-500" />
          <h1 className="text-2xl font-bold">Starred Skills</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load starred skills</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star className="h-6 w-6 text-yellow-500" />
          <h1 className="text-2xl font-bold">Starred Skills</h1>
          <span className="text-muted-foreground">({starredSkills.length})</span>
        </div>
      </div>

      {starredSkills.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No starred skills yet</h3>
          <p className="text-muted-foreground mb-4">
            Star skills you like to save them here for quick access
          </p>
          <Link href="/browse">
            <Button variant="outline" className="gap-2">
              <Package className="h-4 w-4" />
              Browse Skills
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {starredSkills.map((skill: any) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      )}
    </div>
  );
}
