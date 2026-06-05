// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeRequestPayload<T>(body: any): T {
  return body as T;
}

/**
 * Parse JSON body from a NextRequest.
 */
export async function parseBody<T>(req: Request): Promise<T> {
  return req.json() as Promise<T>;
}

export async function getRouteParam(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any,
  paramName: string,
): Promise<string | undefined> {
  if (!context) return undefined;
  const params = await (context.params || context);
  return params?.[paramName];
}
