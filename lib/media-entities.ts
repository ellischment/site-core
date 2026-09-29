// Сущности, к которым можно загружать фото: собираются из module.ts всех модулей.
// Загрузка к неизвестной сущности отклоняется: иначе в базу попадали бы фото
// без владельца, которые нигде не видны и не удаляются.

import { ALL_MODULES } from "@/modules/registry";

export function mediaCacheEntity(entity: string): string | undefined {
  for (const m of ALL_MODULES) {
    const cacheEntity = m.mediaEntities?.[entity];
    if (cacheEntity) return cacheEntity;
  }
  return undefined;
}
