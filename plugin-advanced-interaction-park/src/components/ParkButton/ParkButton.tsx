import React from "react";
import styled from "@emotion/styled";
import { ITask } from "@twilio/flex-ui";

import { PauseIcon } from "@twilio-paste/icons/esm/PauseIcon";
import { Spinner } from '@twilio-paste/core/spinner'

interface ParkButtonProps {
  task?: ITask;
  isLoading: boolean;
  onClick: () => void;
}

interface IconWrapperProps {
  isLoading?: boolean;
}

const IconWrapper = styled.div<IconWrapperProps>`
  margin: 0.8rem;
  cursor: ${(props) => (props.isLoading ? "not-allowed" : "pointer")};
`;

export const ParkButton = (props: ParkButtonProps) => {
  return (
    <>
      {props.isLoading ? (
        <IconWrapper isLoading={props.isLoading}>
          <Spinner size='sizeIcon40' decorative={false} title='Loading' />
        </IconWrapper>
      ) : (
        <IconWrapper
          onClick={props.onClick}
        >
          <PauseIcon
            decorative={false}
            title='Pause Interaction'
            size='sizeIcon40'
          />
        </IconWrapper>
      )}
    </>
  );
};
