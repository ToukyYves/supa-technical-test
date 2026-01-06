import { z } from "zod";

export const recipientSchema = z.object({
  email: z.string().email("Invalid recipient email"),
  name: z.string().optional(),
});

export const sendEmailSchema = z.object({
  recipients: z.array(recipientSchema).min(1, "Select at least one recipient"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

export type RecipientInput = z.infer<typeof recipientSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
