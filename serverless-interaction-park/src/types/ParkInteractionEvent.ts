export type ParkInteractionEvent = {
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
  ShouldRouteToWorker: boolean;
  ShouldTriggerOnTime: boolean;
  WorkerSid: boolean;
  QueueSid: string;
};