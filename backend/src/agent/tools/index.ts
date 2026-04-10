/**
 * Agent tools barrel export.
 *
 * Aggregates all mmx CLI wrapper tools into a single array and
 * re-exports each tool for individual consumption.
 */

import { imageTool } from './mmx-image.js';
import { musicTool } from './mmx-music.js';
import { videoTool } from './mmx-video.js';
import { speechTool } from './mmx-speech.js';
import { visionTool } from './mmx-vision.js';

export const allTools = [imageTool, musicTool, videoTool, speechTool, visionTool];

export { imageTool, musicTool, videoTool, speechTool, visionTool };
