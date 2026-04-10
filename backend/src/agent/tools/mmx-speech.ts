/**
 * Agent tool: synthesize_speech
 *
 * Wraps `mmx speech synthesize` to produce TTS audio files.
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

/**
 * Generate a random hex string for file naming.
 */
function randomHex(length: number): string {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

export const speechTool: AgentTool = {
  name: 'synthesize_speech',
  description:
    'Synthesize speech from text using MiniMax TTS. Returns the file path of the generated audio.',

  input_schema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to convert to speech.',
      },
      voice: {
        type: 'string',
        description:
          'Voice preset name. Defaults to "Chinese_female_gentle".',
      },
    },
    required: ['text'],
  },

  async handler(input: Record<string, any>): Promise<string> {
    const { text, voice } = input as {
      text: string;
      voice?: string;
    };

    const outputPath = `.rip/speech/${randomHex(16)}.mp3`;

    const args = [
      'speech',
      'synthesize',
      '--text', text,
      '--voice', voice ?? 'Chinese_female_gentle',
      '--out', outputPath,
    ];

    await runMmx(args, { timeout: 60_000 });

    return outputPath;
  },
};
