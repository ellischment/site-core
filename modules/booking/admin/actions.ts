"use server";

import { z } from "zod";
import { ActionError, panelAction } from "@/lib/action";
import { ALL_ROLES } from "@/lib/constants";
import { formToObject, toFormState, type FormState } from "@/lib/form-state";
import { slugify } from "@/lib/slug";
import { BOOKING_STATUSES } from "./statuses";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Время в виде 10:00");

const serviceSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Название от 2 символов").max(120),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(2000).default(""),
  durationMin: z.coerce.number().int("Длительность в минутах").min(5, "Не меньше 5 минут").max(24 * 60),
  priceText: z.string().trim().max(60).default(""),
  locationIds: z.array(z.string()).default([]),
  visible: z.boolean().default(true),
  sort: z.coerce.number().int().default(0),
});

const saveService = panelAction({
  roles: ALL_ROLES,
  schema: serviceSchema,
  entity: "bookingService",
  action: "bookingService.save",
  run: async (input, tx) => {
    const slug = (input.slug || slugify(input.title)) || `service-${Date.now()}`;
    const clash = await tx.bookingService.findFirst({ where: { slug, id: input.id ? { not: input.id } : undefined } });
    if (clash) throw new ActionError("Такой адрес уже у другой услуги, поправьте название");
    const data = {
      title: input.title,
      slug,
      description: input.description,
      durationMin: input.durationMin,
      priceText: input.priceText,
      locationIds: JSON.stringify(input.locationIds),
      visible: input.visible,
      sort: input.sort,
    };
    const row = input.id ? await tx.bookingService.update({ where: { id: input.id }, data }) : await tx.bookingService.create({ data });
    return { id: row.id };
  },
  entityId: (_i, o) => o.id,
});

const deleteService = panelAction({
  roles: ALL_ROLES,
  schema: z.object({ id: z.string().min(1) }),
  entity: "bookingService",
  action: "bookingService.delete",
  run: async (input, tx) => {
    const used = await tx.booking.count({ where: { serviceId: input.id } });
    if (used > 0) throw new ActionError("На услугу есть записи. Скройте её вместо удаления.");
    await tx.bookingService.delete({ where: { id: input.id } });
    return { id: input.id };
  },
  entityId: (i) => i.id,
});

const hoursSchema = z.object({
  locationId: z.string().min(1),
  days: z
    .array(z.object({ weekday: z.number().int().min(1).max(7), opensAt: time, closesAt: time, dayOff: z.boolean() }))
    .length(7)
    .refine((days) => days.every((d) => d.dayOff || d.opensAt < d.closesAt), "Открытие должно быть раньше закрытия"),
});

const saveHours = panelAction({
  roles: ALL_ROLES,
  schema: hoursSchema,
  entity: "workingHours",
  action: "workingHours.save",
  run: async (input, tx) => {
    for (const d of input.days) {
      await tx.workingHours.upsert({
        where: { locationId_weekday: { locationId: input.locationId, weekday: d.weekday } },
        create: { locationId: input.locationId, ...d },
        update: { opensAt: d.opensAt, closesAt: d.closesAt, dayOff: d.dayOff },
      });
    }
    return { locationId: input.locationId };
  },
});

const addDayOff = panelAction({
  roles: ALL_ROLES,
  schema: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Выберите дату"), locationId: z.string().optional(), note: z.string().max(120).default("") }),
  entity: "dayOff",
  action: "dayOff.add",
  run: async (input, tx) => {
    const row = await tx.dayOff.create({ data: { date: input.date, locationId: input.locationId || null, note: input.note } });
    return { id: row.id };
  },
});

const removeDayOff = panelAction({
  roles: ALL_ROLES,
  schema: z.object({ id: z.string().min(1) }),
  entity: "dayOff",
  action: "dayOff.delete",
  run: async (input, tx) => {
    await tx.dayOff.deleteMany({ where: { id: input.id } });
    return { id: input.id };
  },
});

const setStatus = panelAction({
  roles: ALL_ROLES,
  schema: z.object({ id: z.string().min(1), status: z.enum(BOOKING_STATUSES) }),
  entity: "booking",
  action: "booking.status",
  run: async (input, tx) => {
    await tx.booking.update({ where: { id: input.id }, data: { status: input.status } });
    return { id: input.id };
  },
  entityId: (i) => i.id,
});

export async function saveServiceAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = formToObject(fd, ["visible"]);
  raw.locationIds = fd.getAll("locationIds").map(String);
  return toFormState(await saveService(raw), "Услуга сохранена");
}

export async function deleteServiceAction(_prev: FormState, fd: FormData): Promise<FormState> {
  return toFormState(await deleteService(formToObject(fd)), "Услуга удалена");
}

export async function saveHoursAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const days = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
    weekday,
    opensAt: String(fd.get(`opensAt-${weekday}`) ?? ""),
    closesAt: String(fd.get(`closesAt-${weekday}`) ?? ""),
    dayOff: fd.get(`dayOff-${weekday}`) === "on",
  }));
  return toFormState(await saveHours({ locationId: fd.get("locationId"), days }), "Часы сохранены");
}

export async function addDayOffAction(_prev: FormState, fd: FormData): Promise<FormState> {
  return toFormState(await addDayOff(formToObject(fd)), "Выходной добавлен");
}

export async function removeDayOffAction(_prev: FormState, fd: FormData): Promise<FormState> {
  return toFormState(await removeDayOff(formToObject(fd)), "Выходной убран");
}

export async function setBookingStatusAction(_prev: FormState, fd: FormData): Promise<FormState> {
  return toFormState(await setStatus(formToObject(fd)), "Статус изменён");
}
