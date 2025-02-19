/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useObservable } from 'react-use';
import { DefaultInput, DefaultInputProps } from '../../../../data/public';
import { QueryAssistServiceSetup } from '../../services/query_assist';

export const QueryAssistCodeEditor = (
  props: DefaultInputProps & {
    queryAssistService: QueryAssistServiceSetup;
  }
) => {
  const query = useObservable(props.queryAssistService.query$, '');
  const updateQuery = (value: string) => {
    props.queryAssistService.updateQuery(value);
  };
  return <DefaultInput {...props} value={query} onChange={updateQuery} />;
};
