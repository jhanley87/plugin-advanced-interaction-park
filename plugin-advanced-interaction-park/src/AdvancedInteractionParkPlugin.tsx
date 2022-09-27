import React from 'react';
import * as Flex from '@twilio/flex-ui';
import { FlexPlugin } from '@twilio/flex-plugin';
import { ParkButton } from './components/ParkButton/ParkButton';
import { CustomizationProvider } from '@twilio-paste/core/customization'

import "./Notifications"
import "./Actions"

const PLUGIN_NAME = 'AdvancedInteractionParkPlugin';

export default class AdvancedInteractionParkPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof Flex }
   */
  async init(flex: typeof Flex, manager: Flex.Manager): Promise<void> {
    flex.setProviders({
      PasteThemeProvider: CustomizationProvider
    })

    const options: Flex.ContentFragmentProps = { sortOrder: -1 };
    flex.TaskCanvasHeader.Content.add(
      <ParkButton key='conversation-park-button' />,
      {
        sortOrder: 1,
        if: props =>
          props.channelDefinition.capabilities.has('Chat') &&
          props.task.taskStatus === 'assigned'
      }
    )

  }
}
