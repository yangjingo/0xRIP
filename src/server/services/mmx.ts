/**
 * mmx CLI subprocess wrapper.
 *
 * Uses Bun.spawn (NOT Node child_process) to interact with the mmx binary.
 */

export interface MmxOptions {
  timeout?: number; // ms, default 60000
  json?: boolean;   // parse JSON output
}

const DEFAULT_TIMEOUT = 60_000;

/**
 * Execute an mmx command and return raw stdout.
 * Throws on non-zero exit with stderr in the error message.
 */
export async function runMmx(
  args: string[],
  options?: MmxOptions,
): Promise<string> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const controller = new AbortController();

  const timer = setTimeout(() => controller.abort(), timeout);

  const proc = Bun.spawn(['mmx', ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
    signal: controller.signal,
  });

  try {
    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    if (exitCode !== 0) {
      throw new Error(
        `mmx ${args.join(' ')} exited ${exitCode}: ${stderr.trim() || stdout.trim()}`,
      );
    }

    return stdout;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Execute an mmx command and parse the result as JSON.
 */
export async function runMmxJson(
  args: string[],
  options?: MmxOptions,
): Promise<any> {
  const raw = await runMmx(args, options);
  return JSON.parse(raw);
}

/**
 * Execute an mmx command and yield stdout chunks as they arrive.
 * Useful for streaming responses from LLM-backed mmx subcommands.
 */
export async function* runMmxStream(
  args: string[],
): AsyncGenerator<string> {
  const proc = Bun.spawn(['mmx', ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const reader = proc.stdout.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
    // Ensure the process is reaped.
    await proc.exited;
  }
}
