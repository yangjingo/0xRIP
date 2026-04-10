/**
 * Agent tool: generate_image
 *
 * Wraps `mmx image generate` to produce AI images from a text prompt.
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

export const imageTool: AgentTool = {
  name: 'generate_image',
  description:
    'Generate one or more AI images from a text prompt using MiniMax. Returns image URLs.',

  input_schema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Text description of the image to generate.',
      },
      aspect_ratio: {
        type: 'string',
        description:
          'Desired aspect ratio, e.g. "1:1", "16:9", "9:16". Defaults to "1:1".',
      },
    },
    required: ['prompt'],
  },

  async handler(input: Record<string, any>): Promise<string> {
    const { prompt, aspect_ratio } = input as {
      prompt: string;
      aspect_ratio?: string;
    };

    const args = [
      'image',
      'generate',
      '--prompt', prompt,
      '--aspect-ratio', aspect_ratio ?? '1:1',
      '--output', 'json',
    ];

    const raw = await runMmx(args, { json: true });

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // If mmx didn't return valid JSON, wrap the raw output.
      return JSON.stringify({ raw });
    }

    const image_urls: string[] = parsed?.image_urls
      ?? parsed?.data?.image_urls
      ?? parsed?.images
      ?? (parsed?.url ? [parsed.url] : []);

    return JSON.stringify({ image_urls });
  },
};
