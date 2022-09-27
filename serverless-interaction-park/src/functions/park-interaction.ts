// Imports global types
import "@twilio-labs/serverless-runtime-types";
// Fetches specific types
import {
  Context,
  ServerlessCallback,
  ServerlessFunctionSignature,
} from "@twilio-labs/serverless-runtime-types/types";

import { validator } from "twilio-flex-token-validator";

import axios from "axios";

type MyEvent = {
  Token: string;
  InteractionSid: string;
  ChannelSid: string;
  ParticipantSid: string;
  ConversationSid: string;
  TaskSid: string;
  WorkflowSid: string;
  TaskChannelUniqueName: string;
  TargetSid: string;
  WorkerName: string;
  TaskAttributes: string;
  UnparkTime?: string;
};

// If you want to use environment variables, you will need to type them like
// this and add them to the Context in the function signature as
// Context<MyContext> as you see below.
type MyContext = {
  ACCOUNT_SID: string;
  AUTH_TOKEN: string;
  CRONHOOKS_API_KEY: string;
  NGROK_ENDPOINT: string;
};

export const handler: ServerlessFunctionSignature<MyContext, MyEvent> =
  async function (
    context: Context<MyContext>,
    event: any,
    callback: ServerlessCallback
  ) {
    const cors = require(Runtime.getFunctions()["utility/cors-response"].path);

    const client = context.getTwilioClient();

    //Create the url for the unpark action
    var unparkUrl = `${
      context.DOMAIN_NAME?.includes("localhost")
        ? context.NGROK_ENDPOINT ?? context.DOMAIN_NAME
        : context.DOMAIN_NAME
    }/unpark-interaction`;

    console.log("UNPARK URL", unparkUrl);

    console.log("Start execute park-interaction", event);

    try {
      let token = await validator(
        event.Token ?? "",
        context.ACCOUNT_SID ?? "",
        context.AUTH_TOKEN ?? ""
      );

      console.log("Flex token valid, executing function");

      try {
        console.log(
          "DEBUG",
          event.InteractionSid,
          event.ChannelSid,
          event.ParticipantSid
        );
        // Remove the agent
        await client.flexApi.v1
          .interaction(event.InteractionSid)
          .channels(event.ChannelSid)
          .participants(event.ParticipantSid)
          .update({ status: "closed" });

        console.log("Agent removed.");

        let webhook = await client.conversations
          .conversations(event.ConversationSid)
          .webhooks.create({
            configuration: {
              method: "POST",
              filters: ["onMessageAdded"],
              url: unparkUrl,
            },
            target: "webhook",
          });

        console.log("webhook added");

        //if a time has been provided at which the interaction should be unparked, then schedule a webhook
        let cronhookId = undefined;
        if (event.UnparkTime) {
          const { data, status } = await axios.post(
            "https://api.cronhooks.io/schedules",
            {
              url: unparkUrl,
              timezone: "Europe/London",
              title: `unpark-${event.ConversationSid}`,
              method: "POST",
              payload: {
                ConversationSid: event.ConversationSid,
              },
              isRecurring: false,
              runAt: event.UnparkTime,
              contentType: "application/json",
            },
            {
              headers: {
                Authorization: `Bearer ${context.CRONHOOKS_API_KEY}`,
              },
            }
          );

          if (status === 200) {
            console.log("conversation unpark time set succesfully");
            cronhookId = data.id;
          } else {
            console.log("problem setting unpark time");
          }
        }

        let newAttributes = {
          ...event,
          WebhookSid: webhook.sid,
          CronhookId: cronhookId,
        };

        await client.conversations
          .conversations(event.ConversationSid)
          .update({ attributes: `${JSON.stringify(newAttributes)}` });

        console.log("conversation updated");

        callback(null, cors.response(newAttributes, 200));
      } catch (error) {
        console.log("error executing function", error);
        callback(null, cors.response(error, 500));
      }
    } catch (error) {
      console.log("Not authenticated");
      //Flex token invalid, send 403 response
      callback(null, cors.response(error, 403));
    }
  };
