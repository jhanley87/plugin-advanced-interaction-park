import React, { ChangeEvent, useState } from "react";
import { Actions, ITask } from "@twilio/flex-ui";
import * as Flex from "@twilio/flex-ui";
import {
  Box,
  Button,
  Modal,
  ModalHeader,
  ModalHeading,
  ModalBody,
  Label,
  Select,
  Option,
  ModalFooter,
  ModalFooterActions,
} from "@twilio-paste/core";
import dayjs, { Dayjs } from "dayjs";

import { ParkButton } from "../ParkButton/ParkButton";
import { DateTimePickerWrapper } from "../DatePicker/DateTimePicker";
import { ParkInteractionPayload } from "../../Actions";

interface SnoozeButtonProps {
  task?: ITask;
}

export const ParkInteractionControl = (props: SnoozeButtonProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [trigger, setTrigger] = React.useState("timer");
  const [routing, setRouting] = React.useState("workflow");
  const [unparkDateTime, setUnparkDateTime] = React.useState<Dayjs | null>(
    dayjs()
  );

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const handleTriggerChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setTrigger(e.target.value);
  };

  const handleRoutingChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setRouting(e.target.value);
  };

  const handleChangeUnparkTime = (newValue: Dayjs | null) => {
    setUnparkDateTime(newValue);
  };

  const handlePark = () => {
    const unparkDateTimeStr = unparkDateTime?.toISOString();

    const actionPayload: ParkInteractionPayload = {
      task: props.task!,
      unparkDateTime: unparkDateTimeStr,
      shouldTriggerOnTime: trigger === "timer",
      shouldRouteToWorker: routing === "worker",
      workerSid: Flex.Manager.getInstance().workerClient?.sid,
    };
    Actions.invokeAction("ParkInteraction", actionPayload);
    setIsOpen(false);
  };

  return (
    <div>
      <ParkButton onClick={handleOpen} />
      <Modal
        ariaLabelledby={"modalHeadingID"}
        isOpen={isOpen}
        onDismiss={handleClose}
        size="default"
      >
        <ModalHeader>
          <ModalHeading as="h3" id={"modalHeadingID"}>
            Park Interaction
          </ModalHeading>
        </ModalHeader>
        <ModalBody>
          <Box padding={"space30"}>
            <Label htmlFor="trigger" required>
              Triggger unpark with:
            </Label>
            <Select
              id="trigger"
              required
              onChange={handleTriggerChange}
              value={trigger}
            >
              <Option value="message">Customer Message</Option>
              <Option value="timer">Customer Message or Timer</Option>
            </Select>
          </Box>

          {trigger === "timer" && (
            <Box padding={"space30"}>
              <Label htmlFor="unparkAt">
                When would you like the interaction to be unparked?
              </Label>
              <DateTimePickerWrapper
                value={unparkDateTime}
                onchange={handleChangeUnparkTime}
              />
            </Box>
          )}
          <Box padding={"space30"}>
            <Label htmlFor="routing" required>
              How would you like the interaction routed when unparked?
            </Label>
            <Select
              id="routing"
              value={routing}
              onChange={handleRoutingChange}
              required
            >
              <Option value="worker">Back to me</Option>
              <Option value="workflow">As per original</Option>
            </Select>
          </Box>
        </ModalBody>
        <ModalFooter>
          <ModalFooterActions>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePark}>
              Park
            </Button>
          </ModalFooterActions>
        </ModalFooter>
      </Modal>
    </div>
  );
};
