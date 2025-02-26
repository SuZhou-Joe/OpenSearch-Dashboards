/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { useObservable } from 'react-use';
import { monaco } from '@osd/monaco';
import { DefaultInput, DefaultInputProps } from '../../../../data/public';
import { QueryAssistServiceSetup } from '../../services/query_assist';
import './query_assist_code_editor.scss';

export const QueryAssistCodeEditor = (
  props: DefaultInputProps & {
    queryAssistService: QueryAssistServiceSetup;
  }
) => {
  const query = useObservable(props.queryAssistService.query$, '');
  const updateQuery = (value: string) => {
    props.queryAssistService.updateQuery(value);
  };
  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const editorReadOnly = useObservable(props.queryAssistService.editorReadOnly$, true);
  return (
    <div
      className={`queryAssist_codeEditor_wrapper queryAssist_codeEditor_wrapper_readOnly_${!!editorReadOnly}`}
    >
      <DefaultInput
        {...props}
        editorDidMount={(...args) => {
          editor.current = args[0];
          editor.current?.onDidFocusEditorText(() => {
            if (editorReadOnly) {
              editor.current?.trigger('keyboard', 'editor.action.commentLine'); // Some non-invasive action
              editor.current?.blur(); // Immediately remove focus
            }
          });
          props.editorDidMount(...args);
        }}
        value={query}
        onChange={updateQuery}
        options={{ readOnly: editorReadOnly }}
      />
    </div>
  );
};
