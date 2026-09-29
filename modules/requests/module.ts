import type { ModuleDefinition } from "../types";

export const requestsModule: ModuleDefinition = {
  id: "requests",
  title: "Заявки",
  sections: [{ slug: "requests", title: "Заявки", roles: ["owner", "admin", "tech"], order: 10 }],
  cacheMap: { request: [] },
  publicPaths: [],
  apiPaths: ["/api/requests"],
  cron: [
    {
      id: "retry-notify",
      title: "Повтор уведомлений о заявках (каждые 5 минут)",
      run: async () => (await import("./lib/pipeline")).retryNotifications(),
    },
    {
      id: "prune-personal",
      title: "Уборка ПДн заявок",
      run: async () => (await import("./lib/prune")).pruneRequests(),
    },
  ],
  auditLabels: {
    "request.status": "Изменён статус заявки",
    "request.delete": "Удалена заявка",
    "request.testNotify": "Отправлено тестовое уведомление",
  },
};
