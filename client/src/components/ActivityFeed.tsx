import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity, Star, Upload, Eye, MessageSquare, GitBranch, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  action: string;
  details?: Record<string, any>;
  createdAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    handle?: string;
    profileImageUrl?: string;
  };
}

interface ActivityFeedProps {
  skillId: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  publish: <Upload className="h-4 w-4 text-green-500" />,
  star: <Star className="h-4 w-4 text-yellow-500" />,
  unstar: <Star className="h-4 w-4 text-muted-foreground" />,
  view: <Eye className="h-4 w-4 text-blue-500" />,
  comment: <MessageSquare className="h-4 w-4 text-purple-500" />,
  fork: <GitBranch className="h-4 w-4 text-orange-500" />,
};

const actionDescriptions: Record<string, (details?: Record<string, any>) => string> = {
  publish: (d) => `published version ${d?.version || "new version"}`,
  star: () => "starred this skill",
  unstar: () => "unstarred this skill",
  view: () => "viewed this skill",
  comment: () => "left a comment",
  fork: () => "forked this skill",
  install: () => "installed this skill",
};

export function ActivityFeed({ skillId }: ActivityFeedProps) {
  const { data: activities, isLoading } = useQuery<ActivityItem[]>({
    queryKey: ["/api/skills", skillId, "activity"],
    queryFn: async () => {
      const res = await fetch(`/api/skills/${skillId}/activity`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!skillId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, 10).map((activity) => {
            const icon = actionIcons[activity.action] || <Activity className="h-4 w-4" />;
            const description = actionDescriptions[activity.action]?.(activity.details) || activity.action;
            const userName = activity.user?.handle || 
              (activity.user?.firstName && activity.user?.lastName 
                ? `${activity.user.firstName} ${activity.user.lastName}` 
                : "Someone");
            
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.user?.profileImageUrl} />
                  <AvatarFallback className="text-xs">
                    {userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm">
                      <span className="font-medium">{userName}</span>{" "}
                      <span className="text-muted-foreground">{description}</span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
