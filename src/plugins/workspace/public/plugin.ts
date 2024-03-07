/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createOsdUrlStateStorage,
  createStateContainer,
  syncState,
} from '../../opensearch_dashboards_utils/public';
import { CoreStart, Plugin } from '../../../core/public';

export class WorkspacePlugin implements Plugin<{}, {}, {}> {
  public async setup() {
    return {};
  }

  public start(core: CoreStart) {
    const initialState = {
      id: 'foo',
    };
    const globalQueryStateContainer = createStateContainer({});
    const urlStateStorageChange = createOsdUrlStateStorage({
      history: core.application.history,
      useHash: false,
    });
    const { start } = syncState({
      /**
       * Hijack urlStateStorage to call set with replace: true
       */
      stateStorage: {
        ...urlStateStorageChange,
        set(key, state) {
          return urlStateStorageChange.set(key, state, {
            replace: true,
          });
        },
      },
      stateContainer: {
        ...globalQueryStateContainer,
        set: (state) => {
          globalQueryStateContainer.set({
            ...initialState,
            ...state,
          });
        },
        get: () => {
          /**
           * Adding a timestamp field to make each response non-idempotent.
           * Or the syncState will compare each state, if no change it won't trigger stateContainer.set
           */
          return {
            ...initialState,
            timestamp: Date.now(),
          };
        },
      },
      storageKey: '_w',
    });
    start();
    return {};
  }

  public stop() {}
}
