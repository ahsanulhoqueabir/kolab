"use client";

import { useEffect, useState } from "react";
import { Users, RefreshCw, Search } from "lucide-react";
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
import { useReturnUrl } from "@/hooks/use-return-url";
import { useSearchParams } from "next/navigation";
import { ListPageHeader } from "@/components/core/shared/ListPageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";

function TeamPageContent() {
  const { withReturnUrl } = useReturnUrl("/team");
  const searchParams = useSearchParams();
  const action = searchParams.get("action");

  const [isAddOpen, setIsAddOpen] = useState(false);

  const members = useTeamStore((state) => state.members);
  const workload = useTeamStore((state) => state.workload);
  const isLoading = useTeamStore((state) => state.isLoading);
  const fetchTeamMembers = useTeamStore((state) => state.fetchTeamMembers);
  const addMember = useTeamStore((state) => state.addMember);
  const removeMember = useTeamStore((state) => state.removeMember);
  const fetchWorkload = useTeamStore((state) => state.fetchWorkload);

  const projects = useProjectStore((state) => state.projects);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Load members when a project is selected
  useEffect(() => {
    if (selectedProjectId) {
      fetchTeamMembers(selectedProjectId);
      fetchWorkload(selectedProjectId);
    }
  }, [selectedProjectId, fetchTeamMembers, fetchWorkload]);

  // Auto-open Add Member dialog when action === "add" and a project is selected
  useEffect(() => {
    if (action === "add" && selectedProjectId) {
      setIsAddOpen(true);
    } else {
      setIsAddOpen(false);
    }
  }, [action, selectedProjectId]);

  const handleAddMember = async (
    profileId: string,
    role: "MEMBER" | "MANAGER",
  ) => {
    if (!selectedProjectId) return;

    try {
      const result = await addMember({
        project: selectedProjectId,
        profile: profileId,
        role,
      });

      if (result.success) {
        toast.success("Member added successfully");
        fetchTeamMembers(selectedProjectId);
        fetchWorkload(selectedProjectId);
      } else {
        toast.error(result.message || "Failed to add member");
      }
    } catch {
      toast.error("Failed to add member");
    }
  };

  const handleRemoveMember = async (profileId: string) => {
    if (!selectedProjectId) return;

    try {
      const result = await removeMember(selectedProjectId, profileId);
      if (result.success) {
        toast.success("Member removed successfully");
        fetchTeamMembers(selectedProjectId);
        fetchWorkload(selectedProjectId);
      } else {
        toast.error(result.message || "Failed to remove member");
      }
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleRefresh = () => {
    if (selectedProjectId) {
      fetchTeamMembers(selectedProjectId);
      fetchWorkload(selectedProjectId);
      toast.success("Team data refreshed");
    }
  };

  // Filter members by search
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
          <Button
            variant="refresh"
            size="icon-sm"
            onClick={handleRefresh}
            disabled={!selectedProjectId}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      {/* Project selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProjectId && (
          <>
            <AddMemberDialog
              projectId={selectedProjectId}
              onAdd={handleAddMember}
              open={isAddOpen}
              onOpenChange={setIsAddOpen}
            />

            <div className="relative ml-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                className="pl-8 h-9 w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {!selectedProjectId ? (
        <div className="text-center py-16">
          <Users className="h-16 w-16 mx-auto text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">
            Select a project to view its team members
          </p>
        </div>
      ) : (
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
