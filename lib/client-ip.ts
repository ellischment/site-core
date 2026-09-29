// Адрес гостя для ограничения частоты и блокировки входа. X-Forwarded-For
// выставляет Caddy сам (header_up в Caddyfile), присланное гостем значение
// перезаписывается, поэтому первому адресу из заголовка можно верить.

import { headers } from "next/headers";

export async function clientIp(): Promise<string> {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return list.get("x-real-ip") ?? "unknown";
}
