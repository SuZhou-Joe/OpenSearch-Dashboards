/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createRef } from 'react';
import { HomeToggleNavSection, Props } from './home_toggle_nav_section';
import { BehaviorSubject } from 'rxjs';
import { mountWithIntl } from 'test_utils/enzyme_helpers';

function mockProps(): Props {
  const toggleCollapsibleNavRef = createRef<
    HTMLButtonElement & {
      euiAnimate: () => void;
    }
  >();

  return {
    isNavOpen: true,
    setIsNavOpen: jest.fn(),
    navId: '',
    toggleCollapsibleNavRef,
    currentAppId$: new BehaviorSubject(''),
    navGroupEnabled: false,
    workspaceEnabled: false,
  };
}

describe('<HomeToggleNavSection />', () => {
  it('should render normally', () => {
    const props = mockProps();

    const component = mountWithIntl(<HomeToggleNavSection {...props} />);
    expect(component.find('.header__toggleNavButtonSection').exists()).toBeTruthy();
  });

  it('show return null when workspace enabled + homepage + new navigation enabled', () => {
    const props = mockProps();

    props.currentAppId$ = new BehaviorSubject('home');

    const component = mountWithIntl(
      <HomeToggleNavSection {...props} navGroupEnabled workspaceEnabled />
    );
    expect(component.find('.header__toggleNavButtonSection').exists()).toBeFalsy();
  });
});
