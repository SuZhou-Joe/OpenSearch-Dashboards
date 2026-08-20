/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';

/** Execution status of the tool call, mirroring `TimelineToolCall['status']`. */
export type ToolResultStatus = 'running' | 'completed' | 'error';

/**
 * Everything a custom result renderer needs to draw a tool-specific result
 * card. `result` is the raw, unparsed result string (the same value the
 * built-in renderer receives); `args` is the raw, unparsed arguments string
 * the tool was called with. Renderers that need parsed values should parse
 * these themselves so they stay in control of malformed-input handling.
 */
export interface ToolResultRendererProps {
  /** Raw, unparsed tool result string. */
  result: string;
  /** Name of the tool that produced this result. */
  toolName: string;
  /** Raw, unparsed arguments string the tool was called with, if any. */
  args?: string;
  /** Execution status of the tool call. */
  status: ToolResultStatus;
}

/**
 * A per-tool result renderer registered by another plugin. Return `null` (or
 * `undefined`) to defer to the built-in shape-guessing renderer — this lets a
 * renderer handle only the shapes it recognizes and fall back for the rest.
 */
export interface ToolResultRenderer {
  /** Tool name this renderer applies to (matched exactly). */
  toolName: string;
  /** Renders the result content, or returns null to fall back to the default. */
  render: (props: ToolResultRendererProps) => ReactNode;
}

/**
 * Registry of per-tool result renderers. A single renderer may be registered
 * per tool name; registering the same name twice warns and keeps the first,
 * matching `SlashCommandRegistry`'s behavior.
 */
class ToolResultRendererRegistry {
  private renderers: Map<string, ToolResultRenderer> = new Map();

  register(renderer: ToolResultRenderer) {
    if (this.renderers.has(renderer.toolName)) {
      // eslint-disable-next-line no-console
      console.warn(`Tool result renderer for "${renderer.toolName}" is already registered.`);
      return;
    }
    this.renderers.set(renderer.toolName, renderer);
  }

  unregister(toolName: string) {
    this.renderers.delete(toolName);
  }

  get(toolName: string): ToolResultRenderer | undefined {
    return this.renderers.get(toolName);
  }
}

export const toolResultRendererRegistry = new ToolResultRendererRegistry();
