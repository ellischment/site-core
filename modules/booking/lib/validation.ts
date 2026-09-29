import { z } from "zod";
import { contactFields, refineContact } from "@/lib/contact";

export const bookingSchema = z
  .object({
    serviceId: z.string().min(1, "Выберите услугу"),
    locationId: z.string().min(1, "Выберите место"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Выберите дату"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Выберите время"),
    ...contactFields,
  })
  .transform(refineContact);

export type BookingInput = z.output<typeof bookingSchema>;
