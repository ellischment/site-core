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
    phone: "+7 900 000-00-00",
    telegram: "example_site",
    locations: [
      { id: "main", title: "Основная точка", address: "ул. Примерная, 1" },
      { id: "online", title: "Онлайн", online: true },
    ],
  },
  domains: {
    primary: "example.invalid",
  },
  timezone: "Europe/Moscow",
  // В шаблоне включены все модули: так их проверяют сквозные тесты.
  // npm run new-client оставляет только нужные клиенту.
  modules: {
    requests: {},
    booking: {},
    catalog: {},
    blog: {},
    reviews: {},
    gallery: {},
  },
  nav: [],
  seo: {
    defaultTitle: "Новый сайт",
    description: "Сайт на основе site-core.",
  },
});
