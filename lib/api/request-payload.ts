// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeRequestPayload<T>(body: any): T {
  return body as T;
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
