import { z } from "zod";

export const webhookEndpointSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  url: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
      message: "URL must start with http:// or https://",
    })
    .max(2000),
  secret: z.string().trim().max(200).optional(),
});
