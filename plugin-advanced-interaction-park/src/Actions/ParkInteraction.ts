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

interface ParkInteractionPayload {
  task: ITask;
  targetSid: string;
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
    Token: Flex.Manager.getInstance().user.token,
    UnparkTime: new Date((new Date).getTime() + 61 * 60000).toISOString() //todo: make this a param
  };

  try {
    //const { data, status } = await axios.post(URL_PARK_AN_INTERACTION, body);
    let status = 200;
    
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
