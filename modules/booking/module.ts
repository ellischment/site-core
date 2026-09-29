import type { ModuleDefinition } from "../types";

export const bookingModule: ModuleDefinition = {
  id: "booking",
  title: "Запись",
  sections: [
    { slug: "today", title: "Сегодня", roles: ["owner", "admin", "tech"], order: 5 },
    { slug: "booking", title: "Запись", roles: ["owner", "admin", "tech"], order: 11 },
    { slug: "booking-settings", title: "Услуги и часы", roles: ["owner", "admin", "tech"], order: 12 },
  ],
  cacheMap: { booking: [], bookingService: ["booking"], workingHours: ["booking"], dayOff: ["booking"] },
  publicPaths: ["/booking"],
  apiPaths: ["/api/booking"],
  cron: [
    { id: "retry-booking-notify", title: "Повтор уведомлений о записи (каждые 5 минут)", run: async () => (await import("./lib/pipeline")).retryBookingNotifications() },
    { id: "prune-personal", title: "Уборка ПДн записи", run: async () => (await import("./lib/prune")).pruneBookings() },
  ],
  sitemap: async () => [{ path: "/booking" }],
  auditLabels: {
    "bookingService.save": "Сохранена услуга записи",
    "bookingService.delete": "Удалена услуга записи",
    "workingHours.save": "Изменены часы работы",
    "dayOff.add": "Добавлен выходной",
    "dayOff.delete": "Убран выходной",
    "booking.status": "Изменён статус записи",
  },
};
