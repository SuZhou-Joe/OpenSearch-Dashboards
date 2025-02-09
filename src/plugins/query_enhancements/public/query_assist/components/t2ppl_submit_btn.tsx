/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiIcon,
  EuiSplitButton,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
} from '@elastic/eui';
import React, { SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { DataPublicPluginSetup, CustomSubmitButtonProps } from 'src/plugins/data/public';
import { GenSparkle } from './icons/gen_sparkle';
import { GenPlay } from './icons/gen_play';
import { Dataset } from '../../../../data/common';
import {
  IDataPluginServices,
  PersistedLog,
  QueryEditorExtensionDependencies,
} from '../../../../data/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { QueryAssistParameters } from '../../../common/query_assist';
import { getStorage } from '../../services';
import { useGenerateQuery } from '../hooks';
import { getPersistedLog, AgentError, ProhibitedQueryError } from '../utils';
import { QueryAssistCallOut, QueryAssistCallOutType } from './call_outs';
import { QueryAssistInput } from './query_assist_input';
import { useQueryAssist } from '../hooks';

const options = [
  {
    icon: GenPlay,
    content: i18n.translate('queryEnhancements.query_assist.generate_and_run', {
      defaultMessage: 'Generate and run',
    }),
  },
  {
    icon: GenSparkle,
    content: i18n.translate('queryEnhancements.query_assist.generate_query', {
      defaultMessage: 'Generate query',
    }),
  },
  {
    icon: 'play',
    content: i18n.translate('queryEnhancements.query_assist.run_query', {
      defaultMessage: 'Run query',
    }),
  },
];

export const T2PPLSubmitBtn = (
  props: CustomSubmitButtonProps & {
    data: DataPublicPluginSetup;
  }
) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedOption = options[selectedIndex];
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const queryString = services.data.query.queryString;
  const inputRef = useRef<HTMLInputElement>(null);
  const storage = getStorage();
  const persistedLog: PersistedLog = useMemo(
    () => getPersistedLog(services.uiSettings, storage, 'query-assist'),
    [services.uiSettings, storage]
  );
  const { generateQuery, loading } = useGenerateQuery();
  const [callOutType, setCallOutType] = useState<QueryAssistCallOutType>();
  const dismissCallout = () => setCallOutType(undefined);
  const [agentError, setAgentError] = useState<AgentError>();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | undefined>(
    queryString.getQuery().dataset
  );
  const selectedQueryIndex = selectedDataset?.title;
  const previousQuestionRef = useRef<string>();
  const { updateQuestion } = useQueryAssist();

  useEffect(() => {
    const subscription = queryString.getUpdates$().subscribe((query) => {
      setSelectedDataset(query.dataset);
    });
    return () => subscription.unsubscribe();
  }, [queryString]);

  const onSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (!inputRef.current?.value) {
      setCallOutType('empty_query');
      return;
    }
    if (!selectedQueryIndex) {
      setCallOutType('empty_index');
      return;
    }
    dismissCallout();
    setAgentError(undefined);
    previousQuestionRef.current = inputRef.current.value;
    persistedLog.add(inputRef.current.value);
    updateQuestion(inputRef.current.value);
    const params: QueryAssistParameters = {
      question: inputRef.current.value,
      index: selectedQueryIndex,
      language: 'PPL',
      dataSourceId: selectedDataset?.dataSource?.id,
    };
    const { response, error } = await generateQuery(params);
    if (error) {
      if (error instanceof ProhibitedQueryError) {
        setCallOutType('invalid_query');
      } else if (error instanceof AgentError) {
        setAgentError(error);
      } else {
        services.notifications.toasts.addError(error, { title: 'Failed to generate results' });
      }
    } else if (response) {
      services.data.query.queryString.setQuery({
        query: response.query,
        language: params.language,
        dataset: selectedDataset,
      });
      if (response.timeRange) services.data.query.timefilter.timefilter.setTime(response.timeRange);
      setCallOutType('query_generated');
    }
  };

  return (
    <EuiSplitButton
      size="s"
      fill
      selectedIndex={selectedIndex}
      options={options.map((option, index) => ({
        display: (
          <EuiButtonEmpty color="text" iconType={option.icon} size="s">
            {option.content}
          </EuiButtonEmpty>
        ),
        onClick: () => {
          setSelectedIndex(index);
        },
      }))}
      buttonProps={{
        iconType: selectedOption.icon,
      }}
      onClick={() => {
        const timeRange = props.data.query.timefilter.timefilter.getTime();
        props.submitQuery?.({
          query: props.data.query.queryString.getQuery(),
          dateRange: timeRange,
        });
        // if (selectedIndex === 0) {
        //   props.submitQuery();
        // } else if (selectedIndex === 1) {
        //   props.submitQuery();
        // } else if (selectedIndex === 2) {
        //   props.submitQuery();
        // }
      }}
    >
      {selectedOption.content}
    </EuiSplitButton>
  );
};
