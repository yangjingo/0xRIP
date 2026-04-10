/**
 * Agent tool: analyze_image
 *
 * Wraps `mmx vision describe` to analyze / describe an image.
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

export const visionTool: AgentTool = {
  name: 'analyze_image',
  description:
    'Analyze or describe an image using MiniMax vision. Provide an image URL and an optional prompt. Returns a text description.',

  input_schema: {
    type: 'object',
    properties: {
      image_url: {
        type: 'string',
        description: 'URL of the image to analyze.',
      },
      prompt: {
        type: 'string',
        description:
          'Optional instruction for the vision model, e.g. "Describe the scene" or "Extract text".',
      },
    },
    required: ['image_url'],
  },

  async handler(input: Record<string, any>): Promise<string> {
    const { image_url, prompt } = input as {
      image_url: string;
      prompt?: string;
    };

    const args = [
      'vision',
      'describe',
      '--image', image_url,
      '--output', 'json',
    ];

    if (prompt) {
      args.push('--prompt', prompt);
    }

    const raw = await runMmx(args, { json: true });

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return raw.trim();
    }

    // Try common response shapes from the mmx CLI.
    const description: string =
      parsed?.description
      ?? parsed?.data?.description
      ?? parsed?.text
      ?? parsed?.content
      ?? raw.trim();

    return typeof description === 'string'
      ? description
      : JSON.stringify(description);
  },
};
