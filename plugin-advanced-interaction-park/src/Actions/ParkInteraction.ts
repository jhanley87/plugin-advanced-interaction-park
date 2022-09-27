import {
  Actions,
  TaskHelper,
  Manager,
  Notifications,
  ActionFunction,
  ITask,
} from "@twilio/flex-ui";
import * as Flex from "@twilio/flex-ui";
import axios from "axios";

export interface ParkInteractionPayload {
  task: ITask;
  targetSid?: string;
  unparkDateTime: string | undefined;
  shouldRouteToWorker: boolean;
  shouldTriggerOnTime: boolean;
  workerSid: string | undefined;
}

const URL_PARK_AN_INTERACTION =
  process.env.FLEX_APP_URL_PARK_AN_INTERACTION ?? "";

const getAgent = async (payload: ParkInteractionPayload) => {
  const participants = await payload.task.getParticipants(
    payload.task.attributes.flexInteractionChannelSid
  );

  let agent;
  for (const p of participants) {
    if (p.type === "agent") {
      agent = p;
      break;
    }
  }

  return agent;
};

const parkInteraction = async (payload: ParkInteractionPayload) => {
  if (!TaskHelper.isCBMTask(payload.task)) {
    return;
  }

  const agent = await getAgent(payload);

  const manager = Manager.getInstance();

  const body = {
    ChannelSid: agent.channelSid,
    InteractionSid: agent.interactionSid,
    ParticipantSid: agent.participantSid,
    ConversationSid: agent.mediaProperties.conversationSid,
    TaskSid: payload.task.taskSid,
    WorkflowSid: payload.task.workflowSid,
    TaskChannelUniqueName: payload.task.taskChannelUniqueName,
    TargetSid: payload.targetSid,
    WorkerName: manager.user.identity,
    TaskAttributes: payload.task.attributes,
    Token: manager.user.token,
    ShouldTriggerOnTime: payload.shouldTriggerOnTime,
    UnparkTime: payload.unparkDateTime,
    ShouldRouteToWorker: payload.shouldRouteToWorker,
    WorkerSid: payload.workerSid,
    QueueSid: payload.task.queueSid
  };

  try {
    console.log("calling park interaction API", body)
    const { data, status } = await axios.post(URL_PARK_AN_INTERACTION, body);
    
    if (status === 200) {
      return Notifications.showNotification("parkedNotification");
    } else {
      console.info("error parking notification", status);
      return Notifications.showNotification("errorParkedNotification");
    }
  } catch (error) {
    console.error(error);
    return Notifications.showNotification("errorParkedNotification");
  }
};

const myCustomAction = "ParkInteraction";

const myCustomActionFunction: ActionFunction = async (payload) => {
  parkInteraction(payload);
};

Actions.registerAction(myCustomAction, myCustomActionFunction);
