import { ParkInteractionEvent } from "./ParkInteractionEvent";

export type RequiredConversationAttributes = ParkInteractionEvent & {
  WebhookSid: string;
  ScheduleId: string;
};
