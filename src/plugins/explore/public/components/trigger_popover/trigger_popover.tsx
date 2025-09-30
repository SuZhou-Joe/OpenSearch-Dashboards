/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { EuiPopover, EuiButtonIcon, EuiFieldText, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import React, { useState, useMemo } from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';

export const TriggerPopover = ({
  iconType,
  log,
}: {
  iconType: string;
  log?: Record<string, any>;
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const handleTogglePopover = () => setIsPopoverOpen((value) => !value);
  const closePopover = () => setIsPopoverOpen(false);
  const [value, setValue] = useState('');

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const {
    services: { data, core },
  } = useOpenSearchDashboards<ExploreServices>();

  const currentTime = useMemo(() => {
    return new Date().getTime();
  }, []);

  const createNotebook = async (name: string) => {
    const query = data.query.queryString.getQuery();
    const bounds = data.query.timefilter.timefilter.getBounds();
    const selectionFrom = (bounds.min?.unix() ?? 0) * 1000;
    const selectionTo = (bounds.max?.unix() ?? 0) * 1000;
    const id = await core.http.post<string>('/api/investigation/note/savedNotebook', {
      body: JSON.stringify({
        name,
        context: {
          dataSourceId: query.dataset?.dataSource?.id ?? '',
          timeRange: {
            selectionFrom,
            selectionTo,
          },
          source: 'Discover',
          timeField: query.dataset?.timeFieldName ?? '',
          index: query.dataset?.title ?? '',
          currentTime,
          variables: {
            pplQuery: query.query,
            pplFilters: data.query.filterManager.getFilters(),
          },
          notebookType: 'Agentic',
          initialGoal: value,
          ...(log ? { log } : {}),
        },
      }),
    });
    if (!id) {
      throw new Error('create notebook error');
    }
    return id;
  };

  const handleInvestigation = async () => {
    const id = await createNotebook('Discover investigation');
    const path = `#${id}`;
    core.application.navigateToApp('investigation-notebooks', {
      path,
    });
  };

  const button = <EuiButtonIcon iconType={iconType} onClick={handleTogglePopover} />;

  return (
    <EuiPopover
      button={button}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="s"
      panelStyle={{ width: 420 }}
    >
      <EuiFlexGroup alignItems="center" gutterSize="xl">
        <EuiFlexItem grow={true}>
          <EuiFieldText
            placeholder="Ask about potential privilege escalation attack"
            value={value}
            onChange={(e) => onChange(e)}
            aria-label="Ask about potential privilege escalation attack"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon iconType="search" onClick={handleInvestigation} aria-label="Investigate" />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPopover>
  );
};
