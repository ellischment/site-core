// lib/cache.ts
// Теги кэша и сброс. Правило: каждое серверное действие панели заканчивается сбросом.

import { revalidatePath, revalidateTag, unstable_cache, updateTag } from "next/cache";
import { ALL_MODULES } from "@/modules/registry";

/** Теги ядра. Модули добавляют свои теги в modules/<id>/module.ts. */
export const TAGS = {
  texts: "texts",
  media: "media",
  redirects: "redirects",
} as const;

export type Tag = string;

/** Что сбрасывать при изменении каждой сущности ядра. */
const CORE_MAP: Record<string, Tag[]> = {
  siteText: [TAGS.texts],
  media: [TAGS.media],
  redirect: [TAGS.redirects],
  // Доступы в панель не отражаются на публичном сайте: сбрасывать нечего.
  // Строка нужна, чтобы действие прошло общий конвейер panelAction.
  user: [],
};

/**
 * Полная карта: ядро + все модули, включённые и нет. Сброс тега выключенного
 * модуля ничего не ломает, а собирать карту по конфигу незачем.
 */
function buildMap(): Record<string, Tag[]> {
  const map: Record<string, Tag[]> = { ...CORE_MAP };
  for (const m of ALL_MODULES) {
    for (const [entity, tags] of Object.entries(m.cacheMap)) {
      if (map[entity]) throw new Error(`Сущность ${entity} (модуль ${m.id}) уже есть в карте сброса`);
      map[entity] = tags;
    }
  }
  return map;
}

const MAP = buildMap();

export type Entity = string;

export function tagsFor(entity: Entity): Tag[] | undefined {
  return MAP[entity];
}

/**
 * Сброс кэша после записи в панели. Пути нужны там, где страница адресуется по slug.
 *
 * Используется updateTag, а не revalidateTag. В Next 16 revalidateTag с профилем max
 * помечает данные устаревшими и отдаёт старое содержимое, пока свежее готовится в фоне.
 * Для панели это неприемлемо: правка должна быть видна сразу после сохранения. updateTag обнуляет запись немедленно, следующий заход ждёт
 * свежие данные. Вызывается только из серверных действий, что для панели и нужно.
 */
export function revalidateEntity(entity: Entity, paths: string[] = []): void {
  const tags = MAP[entity];
  if (!tags) throw new Error(`Нет карты сброса для сущности ${entity}`);

  for (const tag of tags) updateTag(tag);
  for (const path of paths) revalidatePath(path);
}

/**
 * Сброс кэша из Route Handler (например, загрузка медиа). `updateTag`
 * там запрещён — он только для Server Actions (Next 16). Поэтому revalidateTag,
 * который в Next 16 требует профиль: «max» помечает данные устаревшими, свежие
 * подтянутся на следующем заходе. Для действий панели по-прежнему
 * revalidateEntity (updateTag, немедленно).
 */
export function revalidateEntityFromRoute(entity: Entity, paths: string[] = []): void {
  const tags = MAP[entity];
  if (!tags) throw new Error(`Нет карты сброса для сущности ${entity}`);

  for (const tag of tags) revalidateTag(tag, "max");
  for (const path of paths) revalidatePath(path);
}

/**
 * Чтение публичных страниц с тегами. Без тега страница не узнает о правке в панели.
 *
 * Пока построено на unstable_cache. В Next 16 он объявлен устаревшим в пользу
 * директивы use cache, но она требует включить cacheComponents, а это меняет модель
 * рендеринга всего приложения. Переход трогает только этот файл, вызывающий код
 * останется прежним.
 *
 * ВАЖНО, тип здесь врёт про Date. unstable_cache сериализует результат в JSON,
 * поэтому при попадании в кэш поля Date приезжают строками, хотя TResult обещает
 * Date. Пока значение просто выводят на страницу, это незаметно. Как только по
 * дате считают (сравнение, getTime, toISOString), код падает на боевой сборке
 * с «getTime is not a function», причём только при пререндере: на первом живом
 * рендере данные ещё не прошли через кэш и остаются настоящими Date.
 * Кто читает даты через cachedRead, восстанавливает их сразу после чтения.
 */
/**
 * Верхняя граница жизни записи кэша. Сброс по тегам остаётся основным способом:
 * правка в панели доезжает до гостя сразу, ждать час не нужно. Срок нужен от
 * застревания — записи без него живут вечно, и одно неудачно закэшированное
 * значение остаётся навсегда, пока кто-нибудь не тронет нужную сущность.
 *
 * Так уже ловилось: карта сайта отдавала часть адресов, потому что список один
 * раз закэшировался пустым и сбросить его было нечем. Со сроком такое чинится
 * само за час, без срока не чинится никогда.
 */
const MAX_AGE_SECONDS = 3600;

export function cachedRead<TArgs extends unknown[], TResult>(
  keyParts: string[],
  tags: Tag[],
  read: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  return unstable_cache(read, keyParts, { tags, revalidate: MAX_AGE_SECONDS });
}
