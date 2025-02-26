/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { AgentError } from '../query_assist/utils';

export interface QueryAssistCommonExport {
  question$: BehaviorSubject<string>;
  updateQuestion: (question: string) => void;
  calloutType$: BehaviorSubject<QueryAssistCallOutType>;
  updateCalloutType: (type: QueryAssistCallOutType) => void;
  agentError$: BehaviorSubject<AgentError | undefined>;
  updateAgentError: (error: AgentError | undefined) => void;
  loading$: BehaviorSubject<boolean>;
  updateLoading: (loading: boolean) => void;
  query$: BehaviorSubject<string>;
  updateQuery: (query: string) => void;
  editorReadOnly$: BehaviorSubject<boolean>;
  updateEditorReadOnly: (readOnly: boolean) => void;
  reset: () => void;
}

export type QueryAssistCallOutType =
  | undefined
  | 'invalid_query'
  | 'prohibited_query'
  | 'empty_query'
  | 'empty_index'
  | 'query_generated';

export type QueryAssistServiceSetup = QueryAssistCommonExport;

export type QueryAssistServiceStart = QueryAssistCommonExport;

export class QueryAssistService {
  private question$ = new BehaviorSubject<string>('');
  private calloutType$ = new BehaviorSubject<QueryAssistCallOutType>(undefined);
  private agentError$ = new BehaviorSubject<AgentError | undefined>(undefined);
  private loading$ = new BehaviorSubject<boolean>(false);
  private query$ = new BehaviorSubject<string>('');
  private editorReadOnly$ = new BehaviorSubject<boolean>(true);
  private commonExport(): QueryAssistCommonExport {
    return {
      question$: this.question$,
      updateQuestion: (question: string) => this.question$.next(question),
      calloutType$: this.calloutType$,
      updateCalloutType: (type: QueryAssistCallOutType) => this.calloutType$.next(type),
      agentError$: this.agentError$,
      updateAgentError: (error: AgentError | undefined) => this.agentError$.next(error),
      loading$: this.loading$,
      updateLoading: (loading: boolean) => this.loading$.next(loading),
      query$: this.query$,
      updateQuery: (query: string) => this.query$.next(query),
      editorReadOnly$: this.editorReadOnly$,
      updateEditorReadOnly: (readOnly: boolean) => this.editorReadOnly$.next(readOnly),
      reset: () => this.reset(),
    };
  }
  reset() {
    this.commonExport().updateQuestion('');
    this.commonExport().updateCalloutType(undefined);
    this.commonExport().updateAgentError(undefined);
    this.commonExport().updateLoading(false);
    this.commonExport().updateQuery('');
    this.commonExport().updateEditorReadOnly(true);
  }
  setup() {
    return this.commonExport();
  }
  start() {
    return this.commonExport();
  }
}
