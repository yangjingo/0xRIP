/**
 * Agent tool: generate_video
 *
 * Wraps `mmx video generate --async` to start an asynchronous video
 * generation task and return its task_id for later polling.
 *
 * Also exports `queryVideoTask` to check task status.
 */

import { runMmx } from '../../services/mmx.js';

export interface AgentTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  handler: (input: Record<string, any>) => Promise<string>;
}

export const videoTool: AgentTool = {
  name: 'generate_video',
  description:
    'Start an asynchronous AI video generation task using MiniMax. Returns a task_id that can be polled later.',

  input_schema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Text description of the video to generate.',
      },
    },
    required: ['prompt'],
  },

  async handler(input: Record<string, any>): Promise<string> {
    const { prompt } = input as { prompt: string };

    const args = ['video', 'generate', '--prompt', prompt, '--async'];

    const raw = await runMmx(args, { json: true });

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return JSON.stringify({ raw });
    }

    const task_id: string =
      parsed?.task_id
      ?? parsed?.data?.task_id
      ?? parsed?.id
      ?? '';

    return JSON.stringify({ task_id });
  },
};

/**
 * Query the status of a previously submitted video generation task.
 *
 * Calls `mmx video task get --task-id <id> --output json` and returns
 * the parsed JSON result.
 */
export async function queryVideoTask(taskId: string): Promise<string> {
  const raw = await runMmx(
    ['video', 'task', 'get', '--task-id', taskId, '--output', 'json'],
    { json: true },
  );

  // runMmx returns the raw stdout string; attempt to validate it is JSON.
  try {
    JSON.parse(raw);
    return raw;
  } catch {
    return JSON.stringify({ raw });
  }
}
