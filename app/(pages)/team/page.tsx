"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Users, RefreshCw, Search, Building2 } from "lucide-react";
import { Input } from "@/components/core/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/core/ProtectedRoute";
import { PageAccessGuard } from "@/components/core/PageAccessGuard";
import { TeamMemberCard } from "@/components/hr/team/TeamMemberCard";
import { AddMemberDialog } from "@/components/hr/team/AddMemberDialog";
import { WorkloadSummary } from "@/components/hr/team/WorkloadSummary";
import { useTeamStore } from "@/store/team.store";
import { useProjectStore } from "@/store/project.store";
import { ListPageHeader } from "@/components/core/shared/ListPageHeader";
import { SearchComboBox } from "@/components/core/shared/SearchComboBox";
import { Badge } from "@/components/core/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import type { TeamMember } from "@/types/db/team.types";

function TeamPageContent() {
  const members = useTeamStore((state) => state.items);
  const unifiedItems = useTeamStore((state) => state.unifiedItems);
  const workload = useTeamStore((state) => state.workload);
  const isLoading = useTeamStore((state) => state.isLoading);
  const fetchTeamMembers = useTeamStore((state) => state.fetchTeamMembers);
  const fetchUnifiedTeam = useTeamStore((state) => state.fetchUnifiedTeam);
  const addMember = useTeamStore((state) => state.addMember);
  const removeMember = useTeamStore((state) => state.removeMember);
  const fetchWorkload = useTeamStore((state) => state.fetchWorkload);

  const isProjectSearching = useProjectStore((state) => state.isSearching);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const searchProjects = useProjectStore((state) => state.searchProjects);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // On mount: fetch projects + unified team list
  useEffect(() => {
    fetchProjects();
    fetchUnifiedTeam();
  }, [fetchProjects, fetchUnifiedTeam]);

  // Load per-project members when a project is selected
  useEffect(() => {
    if (selectedProjectId) {
      fetchTeamMembers(selectedProjectId);
      fetchWorkload(selectedProjectId);
    }
  }, [selectedProjectId, fetchTeamMembers, fetchWorkload]);

  const handleProjectSearch = useCallback(
    async (query: string) => {
      await searchProjects(query);
      const results = useProjectStore.getState().searchResults || [];
      return results.map((p) => ({ value: p.id, label: p.name }));
    },
    [searchProjects],
  );

  const handleAddMember = async (
    projectId: string,
    profileId: string,
    role: "MEMBER" | "MANAGER",
  ) => {
    try {
      const result = await addMember({
        project: projectId,
        profile: profileId,
        role,
      });

      if (result.success) {
        toast.success("Member added successfully");
        if (selectedProjectId === projectId) {
          fetchTeamMembers(projectId);
          fetchWorkload(projectId);
        }
        fetchUnifiedTeam();
      } else {
        toast.error(result.message || "Failed to add member");
      }
    } catch {
      toast.error("Failed to add member");
    }
  };

  const handleRemoveMember = async (profileId: string, projectId?: string) => {
    const pid = projectId || selectedProjectId;
    if (!pid) {
      toast.error("No project selected");
      return;
    }

    try {
      const result = await removeMember(pid, profileId);
      if (result.success) {
        toast.success("Member removed successfully");
        if (selectedProjectId === pid) {
          fetchTeamMembers(pid);
          fetchWorkload(pid);
        }
        fetchUnifiedTeam();
      } else {
        toast.error(result.message || "Failed to remove member");
      }
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleRefresh = useCallback(() => {
    fetchUnifiedTeam();
    if (selectedProjectId) {
      fetchTeamMembers(selectedProjectId);
      fetchWorkload(selectedProjectId);
    }
    toast.success("Team data refreshed");
  }, [selectedProjectId, fetchUnifiedTeam, fetchTeamMembers, fetchWorkload]);

  // Group unified items by project
  const groupedByProject = useMemo(() => {
    const map = new Map<
      string,
      { projectName: string; members: TeamMember[] }
    >();
    for (const item of unifiedItems) {
      const project =
        typeof item.project === "object" && item.project !== null
          ? item.project
          : { id: item.project as string, name: "Unknown" };
      if (!map.has(project.id)) {
        map.set(project.id, { projectName: project.name, members: [] });
      }
      map.get(project.id)!.members.push(item);
    }
    return Array.from(map.entries()).map(([projectId, group]) => ({
      projectId,
      ...group,
    }));
  }, [unifiedItems]);

  // Filter members by search (per-project view)
  const filteredMembers = members.filter((m) => {
    if (!searchQuery) return true;
    const profile =
      typeof m.profile === "object" && m.profile !== null ? m.profile : null;
    const name = profile?.name || "";
    const email = profile?.email || "";
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <ListPageHeader
        title="Team Management"
        description="Manage team members and view workload per project"
        icon={Users}
        actions={
          <Button variant="refresh" size="lg" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* Project selector + actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <SearchComboBox
            options={[]}
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
            placeholder="Search for a project..."
            searchPlaceholder="Type to search projects..."
            emptyMessage="No projects found."
            onSearch={handleProjectSearch}
            isSearching={isProjectSearching}
          />
        </div>

        <AddMemberDialog
          onAdd={handleAddMember}
          defaultProjectId={selectedProjectId}
        />

        {selectedProjectId && (
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              className="pl-8 h-9 w-48"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Unified overview (shown when no project selected) */}
      {!selectedProjectId && unifiedItems.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              Teams Overview ({unifiedItems.length} members)
            </h2>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading teams...
              </div>
            ) : (
              <div className="space-y-6">
                {groupedByProject.map((group) => (
                  <Card key={group.projectId}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="font-semibold">
                            {group.projectName}
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {group.members.length} member
                          {group.members.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {group.members.map((member) => (
                          <TeamMemberCard
                            key={member.id}
                            member={member}
                            onRemove={handleRemoveMember}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Workload across all managed projects */}
          <div>
            <WorkloadSummary workload={workload} isLoading={isLoading} />
          </div>
        </div>
      )}

      {/* Empty state (no project + no unified data) */}
      {!selectedProjectId && unifiedItems.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Users className="h-16 w-16 mx-auto text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">
            Select a project to view its team members, or create a project to
            get started.
          </p>
        </div>
      )}

      {/* Per-project detail view */}
      {selectedProjectId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team members list */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold">
              Team Members ({filteredMembers.length})
            </h2>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading members...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? "No members match your search"
                  : "No members in this project yet. Add members to get started."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMembers.map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    onRemove={handleRemoveMember}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Workload summary */}
          <div>
            <WorkloadSummary workload={workload} isLoading={isLoading} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  return (
    <PageAccessGuard pageUrl="/team">
      <ProtectedRoute>
        <TeamPageContent />
      </ProtectedRoute>
    </PageAccessGuard>
  );
}
