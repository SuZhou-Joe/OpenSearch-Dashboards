/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiForm, EuiFormRow } from '@elastic/eui';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useObservable } from 'react-use';
import { Dataset } from '../../../../data/common';
import {
  IDataPluginServices,
  PersistedLog,
  QueryEditorExtensionDependencies,
} from '../../../../data/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getStorage } from '../../services';
import { getPersistedLog } from '../utils';
import { QueryAssistCallOut } from './call_outs';
import { QueryAssistInput } from './query_assist_input';
import { QueryAssistServiceSetup } from '../../services/query_assist';

interface QueryAssistInputProps {
  dependencies: QueryEditorExtensionDependencies;
  queryAssistService: QueryAssistServiceSetup;
}

export const QueryAssistBar: React.FC<QueryAssistInputProps> = (props) => {
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const queryString = services.data.query.queryString;
  const inputRef = useRef<HTMLInputElement>(null);
  const storage = getStorage();
  const persistedLog: PersistedLog = useMemo(
    () => getPersistedLog(services.uiSettings, storage, 'query-assist'),
    [services.uiSettings, storage]
  );
  const loading = useObservable(props.queryAssistService.loading$);
  const callOutType = useObservable(props.queryAssistService.calloutType$);
  const agentError = useObservable(props.queryAssistService.agentError$);
  const dismissCallout = () => props.queryAssistService.updateCalloutType(undefined);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | undefined>(
    queryString.getQuery().dataset
  );
  const selectedIndex = selectedDataset?.title;
  const previousQuestionRef = useRef<string>();

  useEffect(() => {
    const subscription = queryString.getUpdates$().subscribe((query) => {
      setSelectedDataset(query.dataset);
    });
    return () => subscription.unsubscribe();
  }, [queryString]);

  if (props.dependencies.isCollapsed) return null;

  return (
    <EuiForm component="form" className="queryAssist queryAssist__form">
      <EuiFormRow fullWidth>
        <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center">
          <EuiFlexItem>
            <QueryAssistInput
              inputRef={inputRef}
              persistedLog={persistedLog}
              isDisabled={!!loading}
              selectedIndex={selectedIndex}
              previousQuestion={previousQuestionRef.current}
              error={agentError}
              queryAssistService={props.queryAssistService}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFormRow>
      <QueryAssistCallOut
        language={props.dependencies.language}
        type={callOutType}
        onDismiss={dismissCallout}
      />
    </EuiForm>
  );
};
