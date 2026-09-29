// Описание модуля. Каждый модуль живёт в modules/<id>/ и экспортирует из
// module.ts объект этого типа. Файл module.ts держим лёгким: только данные и
// ленивые import(), чтобы реестр можно было читать из proxy, меню и cron без
// циклических зависимостей и без Prisma в клиентской сборке.

import type { AdminSection } from "@/lib/admin-sections";
import type { ModuleId } from "@/lib/config-schema";

export type CronTask = {
  /** Имя задачи в /api/cron?task=<id>. */
  id: string;
  title: string;
  run: () => Promise<unknown>;
};

export type SitemapEntry = { path: string; lastModified?: Date };

export type ModuleDefinition = {
  id: ModuleId;
  title: string;
  /** Модули, без которых этот не работает. Проверяется при загрузке конфига. */
  dependsOn?: readonly ModuleId[];
  /** Разделы админки. slug уникален среди всех модулей и ядра. */
  sections: readonly Omit<AdminSection, "module">[];
  /** Карта «сущность → теги кэша» для panelAction. */
  cacheMap: Record<string, string[]>;
  /** Публичные адреса модуля (префиксы). Выключенный модуль отдаёт по ним 404. */
  publicPaths: readonly string[];
  /** API-адреса модуля (префиксы). Выключенный модуль отдаёт по ним 404. */
  apiPaths?: readonly string[];
  cron?: readonly CronTask[];
  /**
   * Сущности модуля, к которым загружаются фото (Media.entity), и какую
   * сущность карты кэша сбрасывать после загрузки: { catalogItem: "catalogItem" }.
   */
  mediaEntities?: Record<string, string>;
  sitemap?: () => Promise<SitemapEntry[]>;
  /** Подписи действий для журнала: «request.delete» → «Удалена заявка». */
  auditLabels?: Record<string, string>;
};
