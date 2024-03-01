/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const cleanWorkspaceId = (path: string) => {
  return path.replace(/^\/w\/([^\/]*)/, '');
};
