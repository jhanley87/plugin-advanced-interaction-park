import Scheduler, {
  CreateScheduleInput,
  CreateScheduleOutput,
  DeleteScheduleInput,
  DeleteScheduleOutput,
  SchedulerProviderInput,
} from "../../interfaces/Scheduler";
import axios from "axios";

export const Scheduler: Scheduler = {
  CreateScheduleWebhook: async (
    input: CreateScheduleInput & SchedulerProviderInput
  ): Promise<CreateScheduleOutput> => {
    //Request creation
    const { data, status } = await axios.post(
      "https://api.cronhooks.io/schedules",
      {
        url: input.ScheduledWebhookUrl,
        timezone: "Etc/UTC",
        title: `unpark-${input.ConversationSid}`,
        method: "POST",
        payload: {
          ConversationSid: input.ConversationSid,
        },
        isRecurring: false,
        runAt: input.ScheduleDateTime,
        contentType: "application/json",
      },
      {
        headers: {
          Authorization: `Bearer ${input.SchedulerProviderApiKey}`,
        },
      }
    );

    //Manage result
    if (status !== 200) {
      return {
        Success: false,
        ErrorMessage: `Failed to create schedule ${status}`,
      };
    }

    return {
      ScheduleId: data.id,
      Success: true,
    };
  },

  RemoveWebhookSchedule: async (
    input: DeleteScheduleInput & SchedulerProviderInput
  ): Promise<DeleteScheduleOutput> => {
    //request deletion
    const { data, status } = await axios.delete(
      `https://api.cronhooks.io/schedules/${input.ScheduleId}`,
      {
        headers: {
          Authorization: `Bearer ${input.SchedulerProviderApiKey}`,
        },
      }
    );
    //Manage result
    if (status !== 200) {
      return {
        Success: false,
        ErrorMessage: `Failed to delete schedule ${status}`,
      };
    }

    return { Success: true };
  }
};
