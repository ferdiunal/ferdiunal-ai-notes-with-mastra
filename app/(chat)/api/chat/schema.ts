import { z } from "zod"
import { ChatRoleSchema } from "@/models"

const partSchema = z.object({
  type: z.string(),
  text: z.string()
})

export const schema = z.object({
  id: z.uuid(),
  message: z.object({
    parts: z.array(partSchema),
    id: z.uuid(),
    role: ChatRoleSchema,
    metadata: z.object().optional()
  }),
})