// Задачи планировщика: ядро и включённые модули. Выключенный модуль: его
// задачи не запускаются. Адрес /api/cron?task=<id>.

import { enabledModules } from "@/modules/registry";
import type { CronTask } from "@/modules/types";
import { pruneCorePersonalData } from "./privacy-prune";

const CORE_TASKS: CronTask[] = [
  {
    id: "prune-personal",
    title: "Уборка персональных данных (попытки входа, истёкшие сессии, данные модулей)",
    run: async () => {
      const core = await pruneCorePersonalData();
      // Модули убирают свои ПДн той же задачей: одна строка crontab на всё.
      const modules: Record<string, unknown> = {};
      for (const m of enabledModules()) {
        const task = m.cron?.find((t) => t.id === "prune-personal");
        if (task) modules[m.id] = await task.run();
      }
      return { ...core, modules };
    },
  },
];

export function cronTasks(): CronTask[] {
  const fromModules = enabledModules().flatMap((m) => (m.cron ?? []).filter((t) => t.id !== "prune-personal"));
  return [...CORE_TASKS, ...fromModules];
}
