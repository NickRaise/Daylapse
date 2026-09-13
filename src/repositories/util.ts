// Wraps a repository query, logging failures under a label and returning a fallback instead of throwing.
export async function runQuery<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[${label}] failed:`, error);
    return fallback;
  }
}
