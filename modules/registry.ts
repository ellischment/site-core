// Реестр модулей. Новый модуль добавляется одной строкой в ALL_MODULES.
// Включён ли модуль, решает client.config.ts (раздел modules).

import { config } from "@/lib/config";
import type { ModuleId } from "@/lib/config-schema";
import type { ModuleDefinition } from "./types";

export const ALL_MODULES: readonly ModuleDefinition[] = [];

export function isEnabled(id: ModuleId): boolean {
  return config.modules[id] !== undefined;
}

export function enabledModules(): ModuleDefinition[] {
  return ALL_MODULES.filter((m) => isEnabled(m.id));
}

export function disabledModules(): ModuleDefinition[] {
  return ALL_MODULES.filter((m) => !isEnabled(m.id));
}

/** Модуль включён, а его зависимость нет: ошибка конфигурации, видна сразу. */
export function checkDependencies(): string[] {
  const problems: string[] = [];
  for (const m of enabledModules()) {
    for (const dep of m.dependsOn ?? []) {
      if (!isEnabled(dep)) problems.push(`Модуль ${m.id} требует включённый модуль ${dep}`);
    }
  }
  return problems;
}
