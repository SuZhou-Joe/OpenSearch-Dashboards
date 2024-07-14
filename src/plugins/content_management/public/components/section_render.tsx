/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useObservable } from 'react-use';
import { BehaviorSubject } from 'rxjs';

import { EuiTitle } from '@elastic/eui';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { Content, Section } from '../services';
import { EmbeddableInput, EmbeddableRenderer, EmbeddableStart } from '../../../embeddable/public';
import { DashboardContainerInput } from '../../../dashboard/public';
import { createCardSection, createDashboardSection } from './utils';
import { CARD_CONTAINER } from './card_container/card_container';

interface Props {
  section: Section;
  contents$: BehaviorSubject<Content[]>;
  embeddable: EmbeddableStart;
  savedObjectsClient: SavedObjectsClientContract;
}

export interface CardInput extends EmbeddableInput {
  description: string;
}

const DashboardSection = ({ section, embeddable, contents$, savedObjectsClient }: Props) => {
  const contents = useObservable(contents$);
  const [input, setInput] = useState<DashboardContainerInput>();

  useEffect(() => {
    if (section.kind === 'dashboard') {
      createDashboardSection(section, contents ?? [], { savedObjectsClient }).then((ds) =>
        setInput(ds)
      );
    }
  }, [section, contents, savedObjectsClient]);

  const factory = embeddable.getEmbeddableFactory('dashboard');

  if (section.kind === 'dashboard' && factory && input) {
    // const input = createDashboardSection(section, contents ?? []);
    return <EmbeddableRenderer factory={factory} input={input} />;
  }

  return null;
};

const CardSection = ({ section, embeddable, contents$ }: Props) => {
  const contents = useObservable(contents$);
  const input = useMemo(() => {
    return createCardSection(section, contents ?? []);
  }, [section, contents]);

  const factory = embeddable.getEmbeddableFactory(CARD_CONTAINER);

  if (section.kind === 'card' && factory && input) {
    return (
      <div style={{ padding: '0 8px' }}>
        <EuiTitle size="s">
          <h2>{section.title}</h2>
        </EuiTitle>
        <EmbeddableRenderer factory={factory} input={input} />
      </div>
    );
  }

  return null;
};

export const SectionRender = (props: Props) => {
  if (props.section.kind === 'dashboard') {
    return <DashboardSection {...props} />;
  }

  if (props.section.kind === 'card') {
    return <CardSection {...props} />;
  }

  if (props.section.kind === 'custom') {
    return props.section.render?.(props.contents$.getValue());
  }

  return null;
};
