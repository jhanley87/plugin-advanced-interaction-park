export interface SchedulerProviderInput {
    SchedulerProviderApiKey: string
}

export interface CreateScheduleInput {
    ConversationSid: string,
    ScheduleDateTime: string,
    ScheduledWebhookUrl: string,
}

export interface DeleteScheduleInput {
    ScheduleId: string
}

export interface CreateScheduleOutput {
    Success: boolean,
    ScheduleId?: string,
    ErrorMessage?: string
}

export interface DeleteScheduleOutput {
    Success: boolean,
    ErrorMessage?: string
}

export default interface Scheduler {
    CreateSchedule: (input: CreateScheduleInput & SchedulerProviderInput) => Promise<CreateScheduleOutput>;
    DeleteSchedule: (input: DeleteScheduleInput & SchedulerProviderInput) => Promise<DeleteScheduleOutput>;
}