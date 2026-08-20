/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolResultRenderer, toolResultRendererRegistry } from './tool_result_renderers';

/**
 * Service for registering per-tool result renderers from external plugins.
 * Registered renderers customize the result-content card shown for a specific
 * tool; when none is registered (or the renderer defers), the built-in
 * shape-guessing renderer is used.
 */
export interface ToolResultRendererRegistrySetup {
  /**
   * Register a renderer for a tool's result card.
   * @param renderer - The tool result renderer configuration
   * @returns A function to unregister the renderer
   */
  registerToolResultRenderer: (renderer: ToolResultRenderer) => () => void;
}

export class ToolResultRendererRegistryService {
  public setup(): ToolResultRendererRegistrySetup {
    return {
      registerToolResultRenderer: (renderer: ToolResultRenderer) => {
        toolResultRendererRegistry.register(renderer);

        // Return unregister function
        return () => {
          toolResultRendererRegistry.unregister(renderer.toolName);
        };
      },
    };
  }
}
