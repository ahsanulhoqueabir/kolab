import { NextResponse } from "next/server";

interface SuccessResponseOptions {
  data?: unknown;
  message?: string;
  statusCode?: number;
}

interface ErrorResponseOptions {
  error: string;
  data?: unknown;
  statusCode?: number;
}

/**
 * Success response utility
 * @example ok({ data: { id: "123" }, message: "Created successfully" })
 * @example ok({ data: result, statusCode: 201 })
 */
export function ok(options: SuccessResponseOptions) {
  const { data, message, statusCode = 200 } = options;
  const response: Record<string, unknown> = {
    success: true,
  };
  if (message) response.message = message;
  if (data !== undefined) response.data = data;
  return NextResponse.json(response, { status: statusCode });
}

/**
 * Error response utility
 * @example fail({ error: "Invalid request" })
 * @example fail({ error: "Unauthorized", statusCode: 403 })
 * @example fail({ error: "Not found", data: { details: "..." }, statusCode: 404 })
 */
export function fail(options: ErrorResponseOptions) {
  const { error, data, statusCode = 400 } = options;
  const response: Record<string, unknown> = {
    success: false,
    error,
  };
  if (data !== undefined) response.data = data;
  return NextResponse.json(response, { status: statusCode });
}

export function success<T = unknown>(data: T) {
  return { success: true as const, data };
}

export function error(error: string) {
  return { success: false as const, error };
}
