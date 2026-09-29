# site-core

Одна основа для клиентских сайтов: заявки, запись, каталог, отзывы, блог, галерея, админка, SEO и выкладка на сервер с 1 ГБ памяти.

Клиент описывается двумя файлами: `client.config.ts` (название, контакты, домены, модули) и `theme/tokens.ts` (цвета, шрифты). Ядро одно на всех.

## Первый запуск

```bash
git config core.hooksPath .githooks   # проверка секретов перед коммитом
npm install
cp .env.example .env                  # заполнить значения
npm run db:migrate
npm run seed                          # владелец из SEED_OWNER_*
npm run dev
```

## Проверки

```bash
npm run check   # типы, линтер, юнит-тесты, сборка, сквозные тесты
```

Задача не закрыта, пока `npm run check` красный.

## Новый клиент

Порядок описан в `docs/new-client.md` (появится на этапе 8). Коротко: `npm run new-client`, ответы на вопросы, материалы заказчика через `npm run content:import`.

## Документы

- `CLAUDE.md`: правила и единственные источники правды.
- `STATE.md`: текущее состояние и открытые вопросы.
- `docs/PROMPTS-CORE.md`: этапы сборки основы.
- `docs/client-brief-template.md`: ТЗ клиента на одну страницу.
- `docs/launch-checklist.md`: чек-лист запуска.
