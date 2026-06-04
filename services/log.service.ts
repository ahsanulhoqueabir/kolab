import { getSupabaseServerClient } from "@/lib/api/supabase";
import { success, error } from "@/lib/api/api-response";
import type {
  Logs,
  LogListItem,
  CreateLogParams,
  LogAction,
} from "@/types/db/logs.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceResult<T = any> =
  | { success: true; data: T }
  | { success: false; error: string };

export class LogService {
  private static collection = "logs";

  /**
   * Create a log entry — non-blocking fire-and-forget pattern.
   * The returned promise should NOT be awaited in the main flow.
   */
  static create(params: CreateLogParams): Promise<ServiceResult<Logs>> {
    // Fire-and-forget: we don't await this in the caller
    return this.createInternal(params);
  }

  private static async createInternal(
    params: CreateLogParams,
  ): Promise<ServiceResult<Logs>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data, error: sbError } = await (supabase as any)
        .from(this.collection)
        .insert({
          id: crypto.randomUUID(),
          actor: params.actor,
          table: params.table,
          row: params.row,
          action: params.action,
          description: params.description,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sbError) {
        return error(sbError.message);
      }

      return success(data as Logs);
    } catch (err) {
      return error((err as Error).message || "Failed to create log");
    }
  }

  /**
   * List recent activities with pagination.
   */
  static async list(
    limit = 50,
    offset = 0,
  ): Promise<ServiceResult<LogListItem[]>> {
    try {
      const supabase = getSupabaseServerClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: sbError } = await (supabase as any)
        .from(this.collection)
        .select(
          "id, description, action, table, row, actor (id, name), created_at",
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (sbError) {
        return error(sbError.message);
      }

      return success((data || []) as LogListItem[]);
    } catch (err) {
      return error((err as Error).message || "Failed to fetch logs");
    }
  }

  /**
   * List activities related to a specific project (via its tasks or team).
   */
  static async listByProject(
    projectId: string,
    limit = 50,
  ): Promise<ServiceResult<LogListItem[]>> {
    try {
      const supabase = getSupabaseServerClient();

      // Get logs where the row ID matches the project OR where the table is "task" and the project matches
      // Since we store the row ID, we fetch logs for the project itself
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: sbError } = await (supabase as any)
        .from(this.collection)
        .select(
          "id, description, action, table, row, actor (id, name), created_at",
        )
        .eq("row", projectId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (sbError) {
        return error(sbError.message);
      }

      return success((data || []) as LogListItem[]);
    } catch (err) {
      return error((err as Error).message || "Failed to fetch project logs");
    }
  }

  // ─── Description Builders ───────────────────────────────

  static describeProject(
    action: LogAction,
    projectName: string,
    extra?: string,
  ): string {
    switch (action) {
      case "CREATE":
        return `Project "${projectName}" created`;
      case "UPDATE":
        return `Project "${projectName}" updated${extra ? ` — ${extra}` : ""}`;
      case "DELETE":
        return `Project "${projectName}" deleted`;
    }
  }

  static describeTask(
    action: LogAction,
    taskTitle: string,
    extra?: string,
  ): string {
    switch (action) {
      case "CREATE":
        return `Task "${taskTitle}" created`;
      case "UPDATE":
        return `Task "${taskTitle}" updated${extra ? ` — ${extra}` : ""}`;
      case "DELETE":
        return `Task "${taskTitle}" deleted`;
    }
  }

  static describeTaskStatus(taskTitle: string, newStatus: string): string {
    return `Task "${taskTitle}" marked as ${newStatus.replace("_", " ")}`;
  }

  static describeMember(
    action: "ADD" | "REMOVE",
    memberName: string,
    projectName: string,
  ): string {
    if (action === "ADD") {
      return `Member "${memberName}" added to "${projectName}"`;
    }
    return `Member "${memberName}" removed from "${projectName}"`;
  }
}
