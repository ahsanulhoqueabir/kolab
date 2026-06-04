import * as React from "react";
import { Activity, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RecentActivitiesProps {
  count: number;
  isLoading?: boolean;
}

export function RecentActivities({ count, isLoading }: RecentActivitiesProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Recent Activities</h3>
          </div>
          <Link href="/activity-log">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              View all
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-12 bg-muted rounded animate-pulse" />
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {count} activities this week
              </p>
              <p className="text-xs text-muted-foreground">
                Track all system changes in the activity log
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
