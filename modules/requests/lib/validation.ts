// Схема заявки. Одна и та же на клиенте (удобство) и на сервере (безопасность).

import { z } from "zod";
import { contactFields, refineContact } from "@/lib/contact";

export const requestSchema = z
  .object({
    kind: z.string().min(1, "Неизвестный вид обращения").max(40),
    subject: z.string().trim().max(200, "Слишком длинное название").optional(),
    ...contactFields,
  })
  .transform(refineContact);

export type RequestInput = z.output<typeof requestSchema>;
