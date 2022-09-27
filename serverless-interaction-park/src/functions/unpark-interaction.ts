// Imports global types
import "@twilio-labs/serverless-runtime-types";
// Fetches specific types
import {
  Context,
  ServerlessCallback,
  ServerlessFunctionSignature,
} from "@twilio-labs/serverless-runtime-types/types";

import axios from "axios";

type MyEvent = {
  ConversationSid: string;
};

// If you want to use environment variables, you will need to type them like
// this and add them to the Context in the function signature as
// Context<MyContext> as you see below.
type MyContext = {
  ACCOUNT_SID: string;
  AUTH_TOKEN: string;
  CRONHOOKS_API_KEY: string;
  NGROK_ENDPOINT: string;
  WORKSPACE_SID: string;
};

export const handler: ServerlessFunctionSignature<MyContext, MyEvent> =
  async function (
    context: Context<MyContext>,
    event: MyEvent,
    callback: ServerlessCallback
  ) {
    console.log("Start execute unpark-interaction", event);

    const cors = require(Runtime.getFunctions()["utility/cors-response"].path);

    try {
      const client = context.getTwilioClient();

      let convo = await client.conversations
        .conversations(event.ConversationSid)
        .fetch();

      let attributes = JSON.parse(convo.attributes);

      console.log("removing webhook for conversation", attributes);

      var interactionParticipants = await client.flexApi.v1
        .interaction(attributes.InteractionSid)
        .channels(attributes.ChannelSid)
        .participants.list();
      var interacrtionWithAgent = interactionParticipants.some(
        (participant) => participant.type === "agent"
      );

      if (interacrtionWithAgent) {
        console.log("Interaction is already with an agent");
        callback(null, cors.response("Already with agent", 200));
        return;
      }

      // Remove webhook so it doesn't keep triggering if parked more than once
      await client.conversations
        .conversations(event.ConversationSid)
        .webhooks(attributes.WebhookSid)
        .remove();

      var routingProps: any = {
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

      try {
        console.log(`deleting cronhook ${attributes.CronhookId}`);
        //try delete the cronhook, if it fails move on
        const { data, status } = await axios.delete(
          `https://api.cronhooks.io/schedules/${attributes.CronhookId}`,
          {
            headers: {
              Authorization: `Bearer ${context.CRONHOOKS_API_KEY}`,
            },
          }
        );
      } catch (error) {
        console.log("failed to delete cronhook", error);
      }
      //if we got here everything went well
      callback(null, cors.response(interactionInvite, 200));
    } catch (error) {
      console.log("error executing function", error);
      callback(null, cors.response(error, 500));
    }
  };
