export const BOOKING_STATUSES = ["new", "confirmed", "done", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export const BOOKING_STATUS_TITLES: Record<BookingStatus, string> = {
  new: "Новая",
  confirmed: "Подтверждена",
  done: "Прошла",
  cancelled: "Отменена",
};
