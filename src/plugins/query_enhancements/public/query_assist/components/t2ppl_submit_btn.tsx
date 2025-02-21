/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonEmpty, EuiSplitButton } from '@elastic/eui';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { DataPublicPluginSetup, CustomSubmitButtonProps } from 'src/plugins/data/public';
import { useObservable } from 'react-use';
import { GenSparkle } from './icons/gen_sparkle';
import { GenPlay } from './icons/gen_play';
import { Dataset, T2PPL_LANGUAGE_ID } from '../../../../data/common';
import { IDataPluginServices, PersistedLog } from '../../../../data/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { QueryAssistParameters } from '../../../common/query_assist';
import { getStorage } from '../../services';
import { useGenerateQuery } from '../hooks';
import { getPersistedLog, AgentError, ProhibitedQueryError, appendQueryPrompt } from '../utils';
import { QueryAssistServiceSetup } from '../../services/query_assist';

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
    queryAssistService: QueryAssistServiceSetup;
  }
) => {
  const { queryAssistService } = props;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const query = useObservable(queryAssistService.query$, '');
  const selectedOption = options[selectedIndex];
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const queryString = services.data.query.queryString;

  const question = useObservable(props.queryAssistService.question$, '');

  const storage = getStorage();
  const persistedLog: PersistedLog = useMemo(
    () => getPersistedLog(services.uiSettings, storage, 'query-assist'),
    [services.uiSettings, storage]
  );
  const { generateQuery, loading } = useGenerateQuery(queryAssistService);
  const dismissCallout = () => queryAssistService.updateCalloutType(undefined);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | undefined>(
    queryString.getQuery().dataset
  );
  const selectedQueryIndex = selectedDataset?.title;
  const previousQuestionRef = useRef<string>();

  useEffect(() => {
    const subscription = queryString.getUpdates$().subscribe((queryObj) => {
      setSelectedDataset(queryObj.dataset);
    });
    return () => subscription.unsubscribe();
  }, [queryString]);

  const onGenerateQuery = async () => {
    if (!question) {
      queryAssistService.updateCalloutType('empty_query');
      return;
    }
    if (!selectedQueryIndex) {
      queryAssistService.updateCalloutType('empty_index');
      return;
    }
    dismissCallout();
    queryAssistService.updateAgentError(undefined);
    previousQuestionRef.current = question;
    persistedLog.add(question);

    const params: QueryAssistParameters = {
      // Only append query prompt in request payload
      question: appendQueryPrompt(question),
      index: selectedQueryIndex,
      language: T2PPL_LANGUAGE_ID,
      dataSourceId: selectedDataset?.dataSource?.id,
    };
    const { response, error } = await generateQuery(params);
    if (error) {
      if (error instanceof ProhibitedQueryError) {
        queryAssistService.updateCalloutType('invalid_query');
      } else if (error instanceof AgentError) {
        queryAssistService.updateAgentError(error);
      } else {
        services.notifications.toasts.addError(error, { title: 'Failed to generate results' });
      }
      throw error;
    } else if (response) {
      queryAssistService.updateQuery(response.query);
      queryAssistService.updateQuestion(previousQuestionRef.current);
      if (response.timeRange) services.data.query.timefilter.timefilter.setTime(response.timeRange);
      queryAssistService.updateCalloutType('query_generated');
    }
  };

  const onRunQuery = async () => {
    const timeRange = props.data.query.timefilter.timefilter.getTime();
    props.submitQuery?.({
      query: {
        query,
        language: T2PPL_LANGUAGE_ID,
        dataset: selectedDataset,
      },
      dateRange: timeRange,
    });
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
      disabled={loading}
      buttonProps={{
        iconType: selectedOption.icon,
        isLoading: loading,
      }}
      onClick={async () => {
        if (selectedIndex === 0) {
          await onGenerateQuery();
          await onRunQuery();
        } else if (selectedIndex === 1) {
          await onGenerateQuery();
        } else if (selectedIndex === 2) {
          await onRunQuery();
        }
      }}
    >
      {selectedOption.content}
    </EuiSplitButton>
  );
};
