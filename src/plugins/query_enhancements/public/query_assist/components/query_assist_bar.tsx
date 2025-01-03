/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiForm, EuiFormRow } from '@elastic/eui';
import React, { SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { Dataset, IIndexPattern, IndexPattern, Query, UI_SETTINGS, IIndexPatternFieldList } from '../../../../data/common';
import {
  IDataPluginServices,
  PersistedLog,
  QueryEditorExtensionDependencies,
} from '../../../../data/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { QueryAssistParameters } from '../../../common/query_assist';
import { getStorage, getUiActions } from '../../services';
import { useGenerateQuery } from '../hooks';
import { getPersistedLog, AgentError, ProhibitedQueryError } from '../utils';
import { QueryAssistCallOut, QueryAssistCallOutType } from './call_outs';
import { QueryAssistInput } from './query_assist_input';
import { QueryAssistSubmitButton } from './submit_button';
import { useQueryAssist } from '../hooks';
import { isPPLSupportedType } from '../utils/language_support';

interface QueryAssistInputProps {
  dependencies: QueryEditorExtensionDependencies;
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
  const uiActions = getUiActions();
  const { generateQuery, loading } = useGenerateQuery(uiActions);
  const [callOutType, setCallOutType] = useState<QueryAssistCallOutType>();
  const dismissCallout = () => setCallOutType(undefined);
  const [agentError, setAgentError] = useState<AgentError>();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | undefined>(
    queryString.getQuery().dataset
  );
  const selectedIndex = selectedDataset?.title;
  const previousQuestionRef = useRef<string>();
  const { updateQueryState } = useQueryAssist();
  const { updateQuestion, isQueryAssistCollapsed } = useQueryAssist();
  const selectedIndexPattern = useMemo(() => {
    const firstItem = props.dependencies.indexPatterns?.[0] as IIndexPattern | undefined;
    if (firstItem?.fields) {
      return firstItem;
    }

    return null;
  }, [props.dependencies.indexPatterns]);

  useEffect(() => {
    const subscription = queryString.getUpdates$().subscribe((query) => {
      setSelectedDataset(query.dataset);
    });
    return () => subscription.unsubscribe();
  }, [queryString]);

  const onSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    const paramsForGeneratePPL: {
      fields?: Record<string, unknown>;
      sampleData?: Array<Record<string, unknown>>;
    } = {};
    if (selectedIndexPattern) {
      const data = services.data;
      const filters = data.query.filterManager.getFilters();
      const query = data.query.queryString.getQuery();
      const searchSourceInstance = await services.data.search.searchSource.create({
        index: selectedIndexPattern as IndexPattern,
        size: 2,
        query: query
          ? ({
              ...query,
              query: `source = ${selectedIndexPattern.title} | head 2`,
              useProvidedQuery: true,
            } as Query)
          : undefined,
        highlightAll: true,
        version: true,
        filter: filters,
      });
      // Execute the search
      const fetchResp = await searchSourceInstance.fetch({
        withLongNumeralsSupport: await services.uiSettings.get(UI_SETTINGS.DATA_WITH_LONG_NUMERALS),
      });
      const hits = fetchResp.hits.hits;
      if (hits.length) {
        const fields: Array<{ name: string; type: string; values: unknown[] }> | null =
          fetchResp.hits.hits[0].fields;
        if (fields) {
          paramsForGeneratePPL.fields = fields.reduce(
            (acc, field) => ({
              ...acc,
              [field.name]: field,
            }),
            {}
          );
          paramsForGeneratePPL.sampleData = hits.map((hit) => hit._source);
        }
      }
    }
    if (!inputRef.current?.value) {
      setCallOutType('empty_query');
      return;
    }
    if (!selectedIndex) {
      setCallOutType('empty_index');
      return;
    }
    dismissCallout();
    setAgentError(undefined);
    previousQuestionRef.current = inputRef.current.value;
    persistedLog.add(inputRef.current.value);
    const params: QueryAssistParameters = {
      metadata: {
        paramsForGeneratePPL,
      },
      question: inputRef.current.value,
      index: selectedIndex,
      language: props.dependencies.language,
      dataSourceId: selectedDataset?.dataSource?.id,
    };
    const { response, error } = await generateQuery(params);
    if (error) {
      if (error instanceof ProhibitedQueryError) {
        setCallOutType('invalid_query');
      } else if (error instanceof AgentError) {
        setCallOutType('invalid_query');
        setAgentError(error);
      } else {
        services.notifications.toasts.addError(error, { title: 'Failed to generate results' });
      }
      updateQueryState({
        question: previousQuestionRef.current,
        generatedQuery: '', // query generate failed, set it to empty
      });
    } else if (response) {
      // force setQuery to proceed with updating the query
      services.data.query.queryString.setQuery(
        {
          query: response.query,
          language: params.language,
          dataset: selectedDataset,
        },
        true
      );
      updateQueryState({
        question: previousQuestionRef.current,
        generatedQuery: response.query,
      });
      if (response.timeRange) services.data.query.timefilter.timefilter.setTime(response.timeRange);
      setCallOutType('query_generated');
    }
  };

  if (props.dependencies.isCollapsed) return null;

  const datasetSupported = isPPLSupportedType(selectedDataset?.type);

  let inputPlaceholder = selectedIndex
    ? i18n.translate('queryEnhancements.queryAssist.input.placeholderWithIndex', {
        defaultMessage: 'Ask a natural language question about {selectedIndex} to generate a query',
        values: { selectedIndex },
      })
    : i18n.translate('queryEnhancements.queryAssist.input.placeholderWithoutIndex', {
        defaultMessage: 'Select an index to ask a question',
      });

  if (!datasetSupported && selectedDataset?.title) {
    inputPlaceholder = i18n.translate(
      'queryEnhancements.queryAssist.input.placeholderDataSetNotSupported',
      {
        defaultMessage:
          'Query Assist is not supported by {datasource}. Please select another data source that is compatible to start entering questions or enter PPL below.',
        values: { datasource: selectedDataset.title },
      }
    );
  }

  return (
    <EuiForm component="form" onSubmit={onSubmit} className="queryAssist queryAssist__form">
      <EuiFormRow fullWidth>
        <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center">
          <EuiFlexItem>
            <QueryAssistInput
              inputRef={inputRef}
              persistedLog={persistedLog}
              isDisabled={loading || !datasetSupported}
              selectedIndex={selectedIndex}
              previousQuestion={previousQuestionRef.current}
              error={agentError}
              placeholder={inputPlaceholder}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <QueryAssistSubmitButton isDisabled={loading || selectedIndexPattern?.fieldsLoading || !datasetSupported} />
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
