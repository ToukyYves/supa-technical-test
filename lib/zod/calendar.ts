import { z } from "zod";

export const calendarQuerySchema = z.object({
  timeMin: z.string().refine(v => !isNaN(Date.parse(v)), {
    message: "Invalid ISO datetime",
  }).optional(),
  timeMax: z.string().refine(v => !isNaN(Date.parse(v)), {
    message: "Invalid ISO datetime",
  }).optional(),
});


export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
