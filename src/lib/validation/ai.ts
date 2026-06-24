import { z } from "zod";
import { AI_PROVIDERS } from "@/lib/ai/types";

export const aiSettingsSchema = z.object({
  provider: z.enum(AI_PROVIDERS),
  apiKey: z.string().trim().min(20, "Enter a valid API key").max(500),
  model: z.string().trim().max(100).optional(),
});
