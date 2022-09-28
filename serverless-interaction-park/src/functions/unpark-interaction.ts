// Imports global types
import "@twilio-labs/serverless-runtime-types";
// Fetches specific types
import {
  Context,
  ServerlessCallback,
  ServerlessFunctionSignature,
} from "@twilio-labs/serverless-runtime-types/types";

import Scheduler from "../interfaces/Scheduler";
import { InteractionParkingContext } from "../types/InteractionParkingContext";
import { RequiredConversationAttributes } from "../types/RequiredConversationAttributes";
import { UnparkInteractionEvent } from "../types/UnparkInteractionEvent";

//Change this string to change the scheduler that will be used
const scheduleProviderName = "cronhooks-sheduler-provider";

export const handler: ServerlessFunctionSignature<
  InteractionParkingContext,
  UnparkInteractionEvent
> = async function (
  context: Context<InteractionParkingContext>,
  event: UnparkInteractionEvent,
  callback: ServerlessCallback
) {
  console.log("Start execute unpark-interaction", event);

  const cors = require(Runtime.getFunctions()["utility/cors-response"].path);
  const scheduler: Scheduler = require(Runtime.getAssets()[
    `/scheduler-providers/${scheduleProviderName}.js`
  ].path).Scheduler;

  try {
    const client = context.getTwilioClient();

    let convo = await client.conversations
      .conversations(event.ConversationSid)
      .fetch();

    let attributes: RequiredConversationAttributes = JSON.parse(
      convo.attributes
    );

    console.log("removing webhook for conversation", attributes);

    var interactionParticipants = await client.flexApi.v1
      .interaction(attributes.InteractionSid)
      .channels(attributes.ChannelSid)
      .participants.list();

    var interactionWithAgent = interactionParticipants.some(
      (participant) => participant.type === "agent"
    );

    if (interactionWithAgent) {
      console.log("Interaction is already with an agent");
      callback(null, cors.response("Already with agent", 200));
      return;
    }

    // Remove webhook so it doesn't keep triggering if parked more than once
    await client.conversations
      .conversations(event.ConversationSid)
      .webhooks(attributes.WebhookSid)
      .remove();

    var routingProps: object = {
      workspace_sid: context.WORKSPACE_SID,
      attributes: attributes.TaskAttributes,
      queue_sid: attributes.ShouldRouteToWorker
        ? attributes.QueueSid
        : undefined,
      worker_sid: attributes.ShouldRouteToWorker
        ? attributes.WorkerSid
        : undefined,
      workflow_sid: attributes.WorkflowSid,
      task_channel_unique_name: attributes.TaskChannelUniqueName,
    };

    console.log("inviting new interaction", routingProps);

    // Create a new task through the invites endpoint. Alternatively you can pass
    // a queue_sid and a worker_sid inside properties to add a specific agent back to the interation
    let interactionInvite = await client.flexApi.v1
      .interaction(attributes.InteractionSid)
      .channels(attributes.ChannelSid)
      .invites.create({
        routing: {
          properties: routingProps,
        },
      });

    //if this park had a time trigger
    if (attributes.ShouldTriggerOnTime) {
      try {
        console.log(`deleting schedule ${attributes.ScheduleId}`);
        //try delete the schedule, if it fails move on
        let deleteSchedule = await scheduler.RemoveWebhookSchedule({
          ScheduleId: attributes.ScheduleId,
          SchedulerProviderApiKey: context.SCHEDULER_API_KEY,
        });

        if(!deleteSchedule.Success){
          console.log(`failed to delete schedule ${deleteSchedule.ErrorMessage}`);
        }
      } catch (error) {
        console.log("failed to delete schedule", error);
      }
    }
    //if we got here everything went well
    callback(null, cors.response(interactionInvite, 200));
  } catch (error) {
    console.log("error executing function", error);
    callback(null, cors.response(error, 500));
  }
};
