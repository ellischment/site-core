// Схема конфигурации клиента. Сам конфиг лежит в client.config.ts в корне,
// проверяется схемой при импорте (lib/config.ts): битый конфиг роняет сборку
// сразу с понятным сообщением, а не страницу у гостя через неделю.

import { z } from "zod";

export const REQUEST_CHANNELS = ["call", "telegram", "whatsapp", "max", "sms", "email"] as const;
export type RequestChannel = (typeof REQUEST_CHANNELS)[number];

export const MODULE_IDS = ["requests", "booking", "catalog", "blog", "reviews", "gallery"] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

const hostname = z
  .string()
  .regex(/^[a-z0-9.-]+(:\d+)?$/, "Домен латиницей без https:// и слэшей, например example.ru");

const locationSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "id точки латиницей, например center"),
  title: z.string().min(1),
  address: z.string().optional(),
  /** Ссылка на карту (Яндекс Карты). Карта не встраивается: это внешний запрос. */
  mapUrl: z.string().url().optional(),
  /** Онлайн-формат: адреса нет, запись всё равно возможна. */
  online: z.boolean().default(false),
});

export const clientConfigSchema = z.object({
  /** Полное название, как его видят гости. */
  name: z.string().min(1),
  /** Короткое латинское имя: cookie, имена контейнеров и файлов копий. */
  shortName: z.string().regex(/^[a-z][a-z0-9-]{1,30}$/, "shortName: латиница, цифры и дефис"),

  legalEntity: z.object({
    status: z.enum(["self-employed", "ip", "ooo"]),
    /** ФИО самозанятого или ИП, название ООО. Нужно политике ПДн. */
    fullName: z.string().min(1),
    inn: z.string().regex(/^(\d{10}|\d{12})?$/, "ИНН: 10 или 12 цифр").default(""),
    ogrn: z.string().default(""),
    address: z.string().default(""),
  }),

  contacts: z.object({
    phone: z.string().default(""),
    /** Ник без @. */
    telegram: z.string().regex(/^[A-Za-z0-9_]*$/, "Telegram: ник без @").default(""),
    email: z.string().default(""),
    locations: z.array(locationSchema).default([]),
  }),

  domains: z.object({
    /** Основной публичный домен. */
    primary: hostname,
    /** Дополнительные: перенаправляются на основной (www добавляется сам). */
    extra: z.array(hostname).default([]),
    /**
     * Отдельный домен для админки. Если задан: на нём нет публичных страниц,
     * «/» ведёт в админку, всё закрыто от индексации; на основном домене
     * админка отвечает 404 (proxy.ts).
     */
    admin: hostname.optional(),
  }),

  timezone: z.string().default("Europe/Moscow"),
  locale: z.string().default("ru-RU"),

  /** Включённые модули и их настройки. Нет ключа: модуль выключен. */
  modules: z
    .object({
      requests: z
        .object({
          /** Каналы связи в форме. Первый канал выбран по умолчанию. */
          channels: z.array(z.enum(REQUEST_CHANNELS)).min(1).default(["call", "telegram"]),
          /** Сколько дней хранить заявку с контактами (152-ФЗ: не дольше цели). */
          keepDays: z.number().int().min(7).max(1095).default(180),
          /** Виды обращений: форма шлёт один из них. */
          kinds: z
            .array(z.object({ id: z.string().regex(/^[a-z0-9-]+$/), title: z.string().min(1) }))
            .min(1)
            .default([{ id: "contact", title: "Сообщение" }]),
        })
        .optional(),
      booking: z
        .object({
          /** Шаг сетки времени в минутах. */
          slotMinutes: z.number().int().min(5).max(240).default(30),
          /** На сколько дней вперёд открыта запись. */
          horizonDays: z.number().int().min(1).max(365).default(30),
          /** Не раньше чем за столько минут до начала. */
          leadMinutes: z.number().int().min(0).default(120),
          /** Сколько дней хранить запись с контактами после её даты. */
          keepDays: z.number().int().min(7).max(1095).default(180),
        })
        .optional(),
      catalog: z
        .object({
          mode: z.enum(["services", "products"]).default("services"),
          /** Заголовок раздела. Пусто: «Услуги» или «Товары» по режиму. */
          title: z.string().default(""),
        })
        .optional(),
      blog: z.object({ perPage: z.number().int().min(1).default(9) }).optional(),
      reviews: z.object({}).optional(),
      gallery: z.object({}).optional(),
    })
    .default({}),

  nav: z.array(z.object({ title: z.string(), href: z.string() })).default([]),

  seo: z.object({
    defaultTitle: z.string().min(1),
    description: z.string().min(1),
    /** Тип для schema.org: LocalBusiness, ProfessionalService, HealthAndBeautyBusiness и т.п. */
    businessType: z.string().default("LocalBusiness"),
  }),

  integrations: z
    .object({
      /** id чата берётся из TELEGRAM_CHAT_ID, здесь только включение. */
      telegram: z.object({ enabled: z.boolean().default(true) }).default({ enabled: true }),
      crm: z.object({ enabled: z.boolean().default(false) }).default({ enabled: false }),
      analytics: z
        .object({ yandexMetrikaId: z.string().regex(/^\d*$/).default("") })
        .default({ yandexMetrikaId: "" }),
    })
    .default({
      telegram: { enabled: true },
      crm: { enabled: false },
      analytics: { yandexMetrikaId: "" },
    }),

  legal: z
    .object({
      /** Версия согласия на обработку ПДн. Меняется вместе с текстом политики. */
      consentVersion: z.string().default("2026-01-01"),
    })
    .default({ consentVersion: "2026-01-01" }),
});

/** Проверки между разделами конфига: то, что схема полей не видит. */
export const clientConfigChecked = clientConfigSchema.superRefine((c, ctx) => {
  if (c.modules.booking && c.contacts.locations.length === 0) {
    ctx.addIssue({
      code: "custom",
      path: ["contacts", "locations"],
      message: "Модулю booking нужна хотя бы одна точка (адрес или онлайн)",
    });
  }
});

export type ClientConfigInput = z.input<typeof clientConfigSchema>;
export type ClientConfig = z.output<typeof clientConfigSchema>;

/** Для client.config.ts: подсказки типов в редакторе без лишнего кода. */
export function defineClientConfig(config: ClientConfigInput): ClientConfigInput {
  return config;
}

export function parseClientConfig(raw: unknown): ClientConfig {
  const parsed = clientConfigChecked.safeParse(raw);
  if (!parsed.success) {
    const list = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Ошибка в client.config.ts:\n${list}`);
  }
  return parsed.data;
}
