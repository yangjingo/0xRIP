/**
 * Agent tool: generate_music
 *
 * Wraps `mmx music generate` to produce AI music from a text prompt
 * and optional lyrics.
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

export const musicTool: AgentTool = {
  name: 'generate_music',
  description:
    'Generate AI music from a text prompt. Optionally provide lyrics or request an instrumental track. Returns the file path or URL of the generated audio.',

  input_schema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Style / mood description for the generated music.',
      },
      lyrics: {
        type: 'string',
        description: 'Optional lyrics to sing in the generated track.',
      },
      instrumental: {
        type: 'boolean',
        description:
          'If true, generate an instrumental track without vocals.',
      },
    },
    required: ['prompt'],
  },

  async handler(input: Record<string, any>): Promise<string> {
    const { prompt, lyrics, instrumental } = input as {
      prompt: string;
      lyrics?: string;
      instrumental?: boolean;
    };

    const args = ['music', 'generate', '--prompt', prompt];

    if (lyrics) {
      args.push('--lyrics', lyrics);
    }

    if (instrumental) {
      args.push('--instrumental');
    }

    const outPath = `output-${Date.now()}.mp3`;
    args.push('--out', outPath);

    const result = await runMmx(args, { timeout: 120_000 });

    // mmx may return the path or URL directly, or we fall back to the
    // constructed output path.
    const trimmed = result.trim();
    return trimmed || outPath;
  },
};
