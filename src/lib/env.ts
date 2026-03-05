// Access environment variables that work in both local dev (process.env)
// and Cloudflare Workers (worker bindings via getCloudflareContext)

let cfEnv: Record<string, unknown> | null = null;

function getCfEnv(): Record<string, unknown> {
  if (cfEnv) return cfEnv;
  try {
    // Dynamic import to avoid build errors in non-CF environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    cfEnv = (ctx?.env ?? {}) as Record<string, unknown>;
    return cfEnv;
  } catch {
    cfEnv = {};
    return cfEnv;
  }
}

export function getEnv(key: string): string | undefined {
  // Try process.env first (works in local dev)
  const fromProcess = process.env[key];
  if (fromProcess) return fromProcess;

  // Fall back to Cloudflare worker bindings
  const fromCf = getCfEnv()[key];
  if (typeof fromCf === "string") return fromCf;

  return undefined;
}
