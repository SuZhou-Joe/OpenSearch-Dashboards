/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiHeaderSectionItem, EuiHeaderSectionItemButton, EuiIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Observable } from 'rxjs';
import useObservable from 'react-use/lib/useObservable';

export interface Props {
  isNavOpen: boolean;
  setIsNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
  navId: string;
  toggleCollapsibleNavRef: React.RefObject<
    HTMLButtonElement & {
      euiAnimate: () => void;
    }
  >;
  currentAppId$: Observable<string | undefined>;
  navGroupEnabled: boolean;
  workspaceEnabled: boolean;
}

export const useHideHomeToggleNavSection = ({
  currentAppId$,
  navGroupEnabled,
  workspaceEnabled,
}: {
  currentAppId$: Props['currentAppId$'];
  navGroupEnabled: boolean;
  workspaceEnabled: boolean;
}) => {
  const appId = useObservable(currentAppId$, '');
  return navGroupEnabled && appId === 'home' && workspaceEnabled;
};

export const HomeToggleNavSection = ({
  setIsNavOpen,
  isNavOpen,
  navId,
  toggleCollapsibleNavRef,
  currentAppId$,
  navGroupEnabled,
  workspaceEnabled,
}: Props) => {
  /**
   * This is a workaround on 2.16 to hide the navigation items within left navigation
   * when user is in homepage with workspace enabled + new navigation enabled
   */
  const shouldHideHomeToggleNavSection = useHideHomeToggleNavSection({
    currentAppId$,
    navGroupEnabled,
    workspaceEnabled,
  });

  if (shouldHideHomeToggleNavSection) {
    return null;
  }

  return (
    <EuiHeaderSectionItem border="right" className="header__toggleNavButtonSection">
      <EuiHeaderSectionItemButton
        data-test-subj="toggleNavButton"
        aria-label={i18n.translate('core.ui.primaryNav.toggleNavAriaLabel', {
          defaultMessage: 'Toggle primary navigation',
        })}
        onClick={() => setIsNavOpen(!isNavOpen)}
        aria-expanded={isNavOpen}
        aria-pressed={isNavOpen}
        aria-controls={navId}
        ref={toggleCollapsibleNavRef}
      >
        <EuiIcon
          type="menu"
          size="m"
          title={i18n.translate('core.ui.primaryNav.menu', {
            defaultMessage: 'Menu',
          })}
        />
      </EuiHeaderSectionItemButton>
    </EuiHeaderSectionItem>
  );
};
