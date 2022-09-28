// Imports global types
import "@twilio-labs/serverless-runtime-types";
// Fetches specific types
import {
  Context,
  ServerlessCallback,
  ServerlessFunctionSignature,
} from "@twilio-labs/serverless-runtime-types/types";
import { validator } from "twilio-flex-token-validator";

import { ParkInteractionEvent } from "../types/ParkInteractionEvent";
import { InteractionParkingContext } from "../types/InteractionParkingContext";
import Scheduler from "../interfaces/Scheduler";
import { RequiredConversationAttributes } from "../types/RequiredConversationAttributes";

//Change this string to change the scheduler that will be used
const scheduleProviderName = "cronhooks-sheduler-provider";

export const handler: ServerlessFunctionSignature<
  InteractionParkingContext,
  ParkInteractionEvent
> = async function (
  context: Context<InteractionParkingContext>,
  event: any,
  callback: ServerlessCallback
) {
  const cors = require(Runtime.getFunctions()["utility/cors-response"].path);
  const scheduler: Scheduler = require(Runtime.getAssets()[
    `/scheduler-providers/${scheduleProviderName}.js`
  ].path).Scheduler;

  const client = context.getTwilioClient();

  //Create the url for the unpark action
  var unparkUrl = `https://${
    context.DOMAIN_NAME?.includes("localhost")
      ? context.NGROK_ENDPOINT ?? context.DOMAIN_NAME
      : context.DOMAIN_NAME
  }/unpark-interaction`;

  console.log("URL",unparkUrl)

  console.log("Start execute park-interaction", event);

  try {
    //Validate the request came from flex
    await validator(
      event.Token ?? "",
      context.ACCOUNT_SID ?? "",
      context.AUTH_TOKEN ?? ""
    );

    console.log("Flex token valid, executing function");

    try {
      // Remove the agent
      await client.flexApi.v1
        .interaction(event.InteractionSid)
        .channels(event.ChannelSid)
        .participants(event.ParticipantSid)
        .update({ status: "closed" });

      console.log("Agent removed.");

      //create the webhook that will unpark when customer sends a message
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

      //if we should have a time based trigger create the schedule
      let ScheduleId = undefined;
      if (event.ShouldTriggerOnTime) {
        var schedule = await scheduler.CreateSchedule({
          ConversationSid: event.ConversationSid,
          ScheduleDateTime: event.UnparkTime,
          ScheduledWebhookUrl: unparkUrl,
          SchedulerProviderApiKey: context.SCHEDULER_API_KEY,
        });

        if (schedule.Success) {
          console.log("Schedule created");
          ScheduleId = schedule.ScheduleId;
        } else {
          console.log(`Shedule not created (Error:${schedule.ErrorMessage})`);
        }
      }

      let newAttributes: RequiredConversationAttributes = {
        ...event,
        WebhookSid: webhook.sid,
        ScheduleId: ScheduleId,
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
