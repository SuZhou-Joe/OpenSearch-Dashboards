/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { i18n } from '@osd/i18n';
import { ChromeNavGroup } from 'opensearch-dashboards/public';
import { AppCategory } from '../types';

/** @internal */
export const DEFAULT_APP_CATEGORIES: Record<string, AppCategory> = Object.freeze({
  opensearchDashboards: {
    id: 'opensearchDashboards',
    label: i18n.translate('core.ui.opensearchDashboardsNavList.label', {
      defaultMessage: 'OpenSearch Dashboards',
    }),
    euiIconType: 'inputOutput',
    order: 1000,
  },
  enterpriseSearch: {
    id: 'enterpriseSearch',
    label: i18n.translate('core.ui.enterpriseSearchNavList.label', {
      defaultMessage: 'Enterprise Search',
    }),
    order: 2000,
    euiIconType: 'logoEnterpriseSearch',
  },
  observability: {
    id: 'observability',
    label: i18n.translate('core.ui.observabilityNavList.label', {
      defaultMessage: 'Observability',
    }),
    euiIconType: 'logoObservability',
    order: 3000,
  },
  security: {
    id: 'securitySolution',
    label: i18n.translate('core.ui.securityNavList.label', {
      defaultMessage: 'Security',
    }),
    order: 4000,
    euiIconType: 'logoSecurity',
  },
  management: {
    id: 'management',
    label: i18n.translate('core.ui.managementNavList.label', {
      defaultMessage: 'Management',
    }),
    order: 5000,
    euiIconType: 'managementApp',
  },
});

export const DEFAULT_GROUPS: Record<string, ChromeNavGroup> = Object.freeze({
  observability: {
    id: 'observability',
    title: i18n.translate('workspace.usecase.observability.title', {
      defaultMessage: 'Observability',
    }),
    description: i18n.translate('workspace.usecase.observability.description', {
      defaultMessage:
        'Gain visibility into system health, performance, and reliability through monitoring and analysis of logs, metrics, and traces.',
    }),
  },
  'security-analytics': {
    id: 'security-analytics',
    title: i18n.translate('workspace.usecase.security.analytics.title', {
      defaultMessage: 'Security Analytics',
    }),
    description: i18n.translate('workspace.usecase.analytics.description', {
      defaultMessage:
        'Detect and investigate potential security threats and vulnerabilities across your systems and data.',
    }),
  },
  analytics: {
    id: 'analytics',
    title: i18n.translate('workspace.usecase.analytics.title', {
      defaultMessage: 'Analytics',
    }),
    description: i18n.translate('workspace.usecase.analytics.description', {
      defaultMessage:
        'Analyze data to derive insights, identify patterns and trends, and make data-driven decisions.',
    }),
  },
  search: {
    id: 'search',
    title: i18n.translate('workspace.usecase.search.title', {
      defaultMessage: 'Search',
    }),
    description: i18n.translate('workspace.usecase.search.description', {
      defaultMessage:
        "Quickly find and explore relevant information across your organization's data sources.",
    }),
  },
  settings: {
    id: 'settings',
    title: i18n.translate('nav.group.settings.label', {
      defaultMessage: 'settings and setup',
    }),
    description: i18n.translate('nav.group.settings.description', {
      defaultMessage: 'Setup your cluster.',
    }),
  },
  dataAdministration: {
    id: 'dataAdministration',
    title: i18n.translate('nav.group.dataAdministration.label', {
      defaultMessage: 'data administration',
    }),
    description: i18n.translate('nav.group.dataAdministration.description', {
      defaultMessage: 'Manage your indexes',
    }),
  },
  devTools: {
    id: 'devTools',
    title: i18n.translate('nav.group.devTools.label', {
      defaultMessage: 'developer tools',
    }),
    description: i18n.translate('nav.group.devTools.description', {
      defaultMessage: 'Tools for developer',
    }),
  },
});
