// Проверенная конфигурация клиента. Импортировать отсюда, а не из client.config.ts:
// здесь значения уже прошли схему и заполнены значениями по умолчанию.

import raw from "../client.config";
import { parseClientConfig, type ModuleId } from "./config-schema";

export const config = parseClientConfig(raw);

export function isModuleEnabled(id: ModuleId): boolean {
  return config.modules[id] !== undefined;
}
