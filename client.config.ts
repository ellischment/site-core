// Конфигурация клиента: единственное место, где живут название, реквизиты,
// контакты, домены, модули и меню. Схема и пояснения к полям: lib/config-schema.ts.
// Шаблон основы держит здесь нейтральные значения; npm run new-client заполняет
// этот файл под конкретного клиента.

import { defineClientConfig } from "./lib/config-schema";

export default defineClientConfig({
  name: "Новый сайт",
  shortName: "site",
  legalEntity: {
    status: "self-employed",
    fullName: "Фамилия Имя Отчество",
  },
  contacts: {
    email: "hello@example.invalid",
  },
  domains: {
    primary: "example.invalid",
  },
  timezone: "Europe/Moscow",
  modules: {
    requests: {},
  },
  nav: [],
  seo: {
    defaultTitle: "Новый сайт",
    description: "Сайт на основе site-core.",
  },
});
