/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WORKSPACE_PATH_PREFIX } from './constants';
import { IBasePath } from '../public';

export const getWorkspaceIdFromUrl = (url: string): string => {
  const regexp = /\/w\/([^\/]*)/;
  const urlObject = new URL(url);
  const matchedResult = urlObject.pathname.match(regexp);
  if (matchedResult) {
    return matchedResult[1];
  }

  return '';
};

export const cleanWorkspaceId = (path: string) => {
  return path.replace(/^\/w\/([^\/]*)/, '');
};
