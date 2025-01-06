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

const supportedDataSetTypes = ['INDEXES', 'S3'];

interface QueryAssistInputProps {
  dependencies: QueryEditorExtensionDependencies;
}

const queryPPL = async ({
  services,
  selectedIndexPattern,
  queryString,
}: {
  services: IDataPluginServices;
  selectedIndexPattern: IIndexPattern;
  queryString: string;
}) => {
  const query = services.data.query.queryString.getQuery();
  const searchSourceInstance = await services.data.search.searchSource.create({
    index: selectedIndexPattern as IndexPattern,
    size: 2,
    query: query
      ? ({
          ...query,
          query: queryString,
          useProvidedQuery: true,
        } as Query)
      : undefined,
    highlightAll: true,
    version: true,
  });
  // Execute the search
  const fetchResp = await searchSourceInstance.fetch({
    withLongNumeralsSupport: await services.uiSettings.get(UI_SETTINGS.DATA_WITH_LONG_NUMERALS),
  });
  return fetchResp;
};

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

  const query = services.data.query.queryString.getQuery();

  const onSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    const paramsForGeneratePPL: {
      schema?: Record<string, unknown>;
      samples?: Array<Record<string, unknown>>;
      type?: string;
    } = {};
    if (selectedIndexPattern && query.dataset?.type && query.dataset?.type !== 'INDEXES') {
      const [sampleData, schema] = await Promise.all([
        queryPPL({
          queryString: `source = ${selectedIndexPattern.title} | head 2`,
          services,
          selectedIndexPattern,
        }),
        queryPPL({
          queryString: `describe ${selectedIndexPattern.title}`,
          services,
          selectedIndexPattern,
        }),
      ]);
      paramsForGeneratePPL.type = query.dataset?.type;
      const sampleDataHits = sampleData.hits.hits;
      if (sampleDataHits.length) {
        paramsForGeneratePPL.samples = sampleDataHits.map((hit) => hit._source);
      }

      const schemaHits = schema.hits.hits;
      if (schemaHits.length) {
        paramsForGeneratePPL.schema = schemaHits.reduce(
          (acc, currentSchema) => ({
            ...acc,
            [currentSchema._source.col_name]: currentSchema._source,
          }),
          {}
        );
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
      question: inputRef.current.value,
      index: selectedIndex,
      language: props.dependencies.language,
      dataSourceId: selectedDataset?.dataSource?.id,
      ...paramsForGeneratePPL,
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

  if (
    props.dependencies.isCollapsed ||
    isQueryAssistCollapsed ||
    !supportedDataSetTypes.includes(query.dataset?.type || '')
  )
    return null;

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
