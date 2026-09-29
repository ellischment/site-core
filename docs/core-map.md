# Карта переноса из «Принца и Лиса»

Источник: `../prince-u-lis` (Next 16.3, React 19.2, Prisma 6.19, SQLite). Пути от корня источника.
Спорные места решены по правилу «проще и обратимее» и записаны внизу.

## 1. ЯДРО

Нужно любому сайту без изменений или с минимальной правкой.

| Источник | Куда в основе | Что меняется при переносе |
|---|---|---|
| `lib/action.ts` | `lib/action.ts` | Без изменений. Роли берутся из `lib/constants.ts` ядра |
| `lib/cache.ts` | `lib/cache.ts` | Теги и карта сброса собираются из ядра и `modules/*/module.ts`, а не одним списком |
| `lib/auth.ts` | `lib/auth.ts` | Имя cookie из конфига (`shortName`), без названия студии |
| `lib/roles.ts` | `lib/admin-sections.ts` | Реестр разделов: ядро + разделы включённых модулей. Роли `owner`, `admin`, `tech` без изменений |
| `lib/crypto.ts` | `lib/crypto.ts` | Без изменений |
| `lib/retry.ts` | `lib/retry.ts` | Общая функция задержек. Отправка в amoCRM не переносится: повторяется уведомление в Telegram |
| `lib/media.ts` | `lib/media.ts` | Путь загрузок из переменной `UPLOAD_DIR` |
| `lib/privacy-prune.ts` | `lib/privacy-prune.ts` | Уборка ядра (попытки входа) + задачи модулей регистрируются в `cron` модуля |
| `lib/db.ts` | `lib/db.ts` | Без изменений (WAL, busy_timeout) |
| `lib/env.ts` | `lib/env.ts` | Без amoCRM, `TELEGRAM_*` необязательные |
| `lib/time.ts` | `lib/time.ts` | Часовой пояс из конфига, а не константа `Europe/Moscow` |
| `lib/slug.ts` | `lib/slug.ts` | Без изменений |
| `lib/markdown.ts`, `lib/video.ts` | `lib/markdown.ts`, `lib/video.ts` | Без изменений |
| `lib/audit.ts`, `lib/audit-labels.ts`, `lib/audit-view.ts` | `lib/audit.ts` | Подписи действий регистрируют модули |
| `lib/system.ts` | `lib/system.ts` | Без изменений |
| `lib/site-texts.ts` | `lib/site-texts.ts` | Только механизм чтения `SiteText` с запасным значением. Тексты студии не переносятся |
| `lib/seo-meta.ts`, `lib/schema.ts`, `lib/redirects.ts` | `lib/seo.ts`, `lib/redirects.ts` | Название, домен, тип бизнеса из конфига |
| `lib/telegram.ts` | `lib/telegram.ts` | Текст уведомления из модуля, без названия студии |
| `lib/validation/login.ts`, `user.ts`, `texts.ts` | `lib/validation/` | Без изменений |
| `lib/analytics.ts` | `lib/analytics.ts` | Счётчик из `integrations.analytics`, только после согласия на cookie |
| `lib/readiness.ts` | `lib/readiness.ts` | Этап 7: пункты готовности регистрируют модули |
| `proxy.ts` | `proxy.ts` | Закрытие `/admin` по cookie + правила доменов (для клиентов с разделением доменов) |
| `next.config.ts` | `next.config.ts` | CSP и заголовки без изменений, внешние источники из конфига интеграций |
| `app/api/cron/route.ts` | `app/api/cron/route.ts` | Задачи собираются из ядра и включённых модулей |
| `app/admin/login/*` | `app/admin/login/*` | Без названия студии |
| `app/admin/(panel)/layout.tsx`, `PanelNav.tsx` | то же | Меню строится из реестра разделов |
| `app/admin/(panel)/ConfirmButton.tsx`, `forbidden.tsx` | то же | Без изменений |
| `app/admin/(panel)/parol/*` | `app/admin/(panel)/password/*` | Смена пароля |
| `app/admin/(panel)/audit/*` | то же | Журнал действий |
| `app/admin/(panel)/settings/*` | то же | Доступы (пользователи) |
| `app/admin/(panel)/system/*` | то же | Сессии, попытки входа, копии базы |
| `app/admin/(panel)/media/*`, `app/api/media/upload/route.ts`, `app/uploads/[...put]/route.ts` | то же | Медиатека (этап 4, вместе с первым модулем, которому нужны фото) |
| `app/not-found.tsx`, `app/error.tsx`, `components/StatusPage.tsx` | то же | Тексты из `SiteText` |
| `app/robots.ts`, `app/sitemap.ts`, `app/opengraph-image.tsx` | то же | Адреса из модулей, домен из конфига |
| `components/JsonLd.tsx` (+ тест) | то же | Без изменений |
| `components/CookieConsent.tsx`, `CookieReopen.tsx` | то же | Без изменений |
| `components/ReorderableList.tsx`, `LoadingBar.tsx` | то же | Без изменений |
| `components/admin/Panel.tsx` | то же | Стили через токены |
| `prisma/schema.prisma`: User, Session, LoginAttempt, AuditLog, SiteText, Media | `prisma/schema/core.prisma` | + Redirect (в источнике редиректы в коде `lib/redirects.ts`) |
| `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh` | то же | Лимиты под 1 ГБ: 600m приложению, 128m Caddy |
| `Caddyfile` | `scripts/gen-caddyfile.ts` | Строится из доменов конфига |
| `scripts/deploy.sh`, `rollback.sh`, `backup.sh`, `restore-check.sh`, `maintenance-*.sh`, `deploy/maintenance/` | `scripts/`, `deploy/` | Пути и имя проекта из переменных |
| `scripts/sync-standalone-assets.ts`, `check-env.ts`, `media-prune.ts` | `scripts/` | Без изменений |
| `playwright.config.ts`, `vitest.config.ts`, `eslint.config.mjs`, `tsconfig.json` | то же | Ключи интеграций в e2e обнулены |
| `.githooks/pre-commit`, `.github/workflows/check.yml` | то же | Уже перенесён хук на этапе 0 |
| `docs/politika-personalnyh-dannyh.md`, `soglasie-na-obrabotku.md` | `content/legal/*.md` | Шаблоны с подстановкой `legalEntity` (этап 5) |
| `docs/instrukciya-*.md`, `foto-pamyatka.md` | `docs/client-kit/` | Шаблоны с подстановками (этап 8) |

## 2. МОДУЛИ

| Модуль | Модели Prisma | Разделы админки | Публичные страницы | lib | Тесты | Оценка |
|---|---|---|---|---|---|---|
| **requests** | Request | «Заявки» (`requests/page.tsx`, выгрузка `requests/export`), «Уведомления Telegram» | форма (`components/RequestForm.tsx`), `app/api/requests/route.ts`, `/politika` | `request-pipeline.ts`, `journal.ts`, `telegram.ts`, `retry.ts`, `validation/request.ts` | `validation/request.test.ts`, `telegram.test.ts`, `retry.test.ts`, `crypto.test.ts`, `privacy-prune.test.ts` | 6 ч |
| **booking** | ScheduleSlot, FreeDay, StudioHours + новые Service, Location | «Сегодня» (`today`), «Расписание» (`schedule`) | `/zapis`, `/raspisanie` | `schedule.ts`, `today.ts`, `studio-hours.ts`, `validation/schedule.ts` | `validation/schedule.test.ts`, `time.test.ts` | 10 ч |
| **catalog** | ShopItem, Category (kind=shop) → CatalogItem, CatalogCategory | «Купить» (`shop`) | `/kupit`, `/kupit/[slug]` | `shop.ts`, `price.ts`, `filters.ts`, `validation/shop.ts` | `shop.test.ts`, `price.test.ts`, `filters.test.ts` | 6 ч |
| **blog** | Article | «Блог» (`blog`) | `/blog`, `/blog/[slug]` | `articles.ts`, `markdown.ts`, `validation/article.ts` | `articles.test.ts`, `markdown.test.ts`, `article.test.ts` | 4 ч |
| **reviews** | Review | «Отзывы» (`reviews`) | блок на главной, `components/Reviews.tsx`, `Stars.tsx` | `reviews.ts` | `reviews.test.ts` | 3 ч |
| **gallery** | Work → GalleryItem | «Работы» (часть `shop`) | `/raboty` | `cover-notice.ts`, `media-entities.ts`, `media-usage.ts` | `cover-notice.test.ts` | 4 ч |

## 3. ОБРАЗЕЦ ДЛЯ КЛИЕНТА

Специфично для студии керамики. Остаётся в «Принце и Лисе» как пример наполнения.

| Что | Файлы |
|---|---|
| Гирлянда, снег, сезоны | `components/Garland.tsx`, `Snow.tsx`, `app/admin/(panel)/content/GarlandForm.tsx`, `SeasonForm.tsx`, `lib/appearance*.ts` |
| Занятия, курсы, потоки, анкета «Чем займёмся» | `lib/lessons.ts`, `courses.ts`, `app/(site)/zanyatiya`, `kursy`, `components/TaskOption.tsx`, `QuizLabelsForm.tsx` |
| Мастера | `lib/masters.ts`, `app/(site)/komanda`, `components/MasterCard.tsx` |
| Бонусы | `lib/bonus.ts`, `app/(site)/bonusy` |
| Праздники | `lib/celebrations.ts`, `app/(site)/otprazdnovat` |
| Сотрудничество | `lib/partnerships.ts`, `app/(site)/sotrudnichestvo` |
| События | `lib/events.ts`, `app/(site)/sobytiya`, `components/EventCard.tsx` |
| Главная студии и её блоки | `app/(site)/page.tsx`, `lib/home-blocks*.ts`, `components/HomeSchedule.tsx`, `OtmCard.tsx`, `StickyPrice.tsx` |
| Письма и документы для заказчицы | `docs/pisma-*`, `pismo-*`, `soobshchenie-*` |

## 4. НЕ ТАЩИМ

| Что | Почему |
|---|---|
| `lib/amo.ts`, `scripts/amo-probe.ts`, `docs/amo*` | amoCRM нужна одному клиенту. В конфиге остаётся флаг `integrations.crm` (выкл), интеграция пишется модулем, когда появится заказчик |
| `scripts/telegram-relay.worker.js` | Релей через Cloudflare для сервера в РФ. Оставлен как настройка `TELEGRAM_API_BASE`, сам воркер не нужен |
| `prisma/seed.ts`, `import-content.ts`, `fix-texts.ts`, `rename-content.ts`, `remove-demo.ts`, `import-sections.ts`, `set-article-cover.ts`, `prisma/content/` | Одноразовые скрипты наполнения студии. Вместо них `scripts/seed.ts` (только владелец) и `content:import` (этап 7) |
| `prisma/migrations/` | Схема основы другая, миграции начинаются заново |
| `scripts/data-snapshot.ts`, `scripts/content/normalize.py` | Разовые инструменты проекта |
| `SPEC.md`, `PLAN.md`, `FEATURES.md`, `METHOD.md`, `RATIONALE.md`, `TECH-REVIEW.md`, `REPORT-*.md`, `DESIGN-LOCK.md` | Документы одного проекта. Вместо них `CLAUDE.md`, `STATE.md`, ТЗ на одну страницу |
| `STATE.md` как журнал | 2376 строк. Здесь только текущее состояние |
| `app/styleguide/*` в виде источника | Страница пишется заново на токенах (этап 3) |
| `public/google*.html`, `public/yandex*.html`, `public/medallion.jpg` | Файлы подтверждения и картинки студии |
| `components/Header.tsx`, `Footer.tsx` в виде источника | Вёрстка под макет студии. Пишутся заново из конфига (этап 5) |
| Google Fonts (`next/font/google`) | Правило основы: только свои файлы шрифтов |

## 5. Зашитые значения «Принца и Лиса»

Всё это при переносе уходит в `client.config.ts`, `theme/` или `SiteText`. Значения не повторяю: смотреть в источнике по пути.

| Что | Где в источнике | Куда в основе |
|---|---|---|
| Название студии | `lib/studio.ts` (`STUDIO_NAME`), `app/layout.tsx`, `lib/seo-meta.ts`, все `app/(site)/*/page.tsx` в `metadata`, `app/admin/login/page.tsx`, `PanelNav.tsx`, `lib/telegram.ts` (тестовое сообщение), `app/icon.svg` | `config.name`, `config.shortName` |
| Юрлицо, адрес, город, телефон | `lib/studio.ts` | `config.legalEntity`, `config.contacts` |
| Почта | `app/(site)/politika/page.tsx` | `config.contacts.email` |
| Домен | `Caddyfile`, `lib/seo-meta.ts` (запасной адрес) | `config.domains` |
| Имя cookie сессии | `lib/auth.ts`, `proxy.ts` (`princ_session`) | из `config.shortName` |
| Часовой пояс | `lib/time.ts` (`Europe/Moscow`) | `config.timezone` |
| Палитра | `app/globals.css`, `lib/appearance.ts`, `app/admin/admin.module.css`, `components/admin/Panel.module.css`, 12 файлов `*.module.css` с сырым hex | `theme/tokens.ts` |
| Шрифты | `app/layout.tsx` (Cormorant, Manrope, Neucha через `next/font/google`) | `theme/fonts/` + `theme/tokens.ts` |
| Тексты первого экрана, «доверие», FAQ | `lib/site-texts.ts` (`HERO_DEFAULTS`, `TRUST_DEFAULTS`) | `SiteText` + значения по умолчанию модуля/блока |
| Версия согласия ПДн | `lib/constants.ts` (`CONSENT_VERSION`) | `config.legal.consentVersion` |
| Каналы связи в форме | `lib/validation/request.ts` (`CHANNEL_LABELS`) | настройки модуля requests |
| Типы заявок | `lib/constants.ts` (`REQUEST_TYPES`) | настройки модуля requests |
| Счётчик Метрики | `lib/analytics.ts`, `next.config.ts` (CSP) | `config.integrations.analytics` |
| Меню | `lib/nav.ts` | `config.nav` |

## 6. Порядок переноса

1. Ядро (этап 2): база, вход, панель, журнал, система, cron, `npm run check`. ~10 ч.
2. Конфиг и тема (этап 3). ~6 ч.
3. Модули (этап 4): requests → booking → catalog → blog → reviews → gallery. ~33 ч по таблице раздела 2.
4. Блоки публичной части (этап 5). ~10 ч.
5. Выкладка (этап 6). ~4 ч.
6. Импорт материалов (этап 7). ~6 ч.
7. Новый клиент одной командой (этап 8). ~6 ч.
8. Приёмка и демо (этап 9). ~4 ч.

Итого около 80 часов.

## 7. Решения по спорным местам

- **Request в модуле, а не в ядре.** Заявки нужны почти всем, но не всем. Модуль `requests` включён по умолчанию в шаблоне.
- **Категории.** В источнике одна таблица `Category` на пять видов. В основе у каждого модуля свои категории (`CatalogCategory`), чтобы выключенный модуль не оставлял ссылок из ядра.
- **Media в ядре.** Фото нужны многим модулям. Связь модуль → фото через `entity` + `entityId` в `Media`, без внешних ключей на таблицы модулей: иначе ядро зависело бы от схемы модулей.
- **amoCRM не переносится** (см. раздел 4). Повторы отправки (`lib/retry.ts`) переносятся на уведомления Telegram.
- **Telegram без персональных данных.** Как в источнике: имя и телефон за границу не уходят.
- **Точки (адреса).** В источнике один адрес константой. В основе `config.contacts.locations[]` с признаком «онлайн», его использует booking.
