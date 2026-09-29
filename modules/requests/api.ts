// Приём заявки: POST /api/requests. Публичный адрес, заявку оставляет гость.
// Порядок: дешёвая отсечка по частоте → валидация → конвейер.

import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { prisma } from "@/lib/db";
import { processRequest, RATE_MAX, RATE_MINUTES } from "./lib/pipeline";
import { requestSchema } from "./lib/validation";

const TOO_MANY = "Слишком много заявок с этого устройства. Попробуйте через несколько минут.";
const BUSY = "Сейчас много заявок, не успели сохранить вашу. Отправьте ещё раз через минуту.";

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request): Promise<Response> {
  const ip = clientIp(req);

  // Дешёвая отсечка до разбора тела. Решает не она: тот же счёт повторяется
  // в транзакции конвейера, иначе одновременные заявки проскочат все разом.
  const since = new Date(Date.now() - RATE_MINUTES * 60_000);
  if ((await prisma.request.count({ where: { ip, createdAt: { gte: since } } })) >= RATE_MAX) {
    return NextResponse.json({ error: TOO_MANY }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form";
      if (!fields[key]) fields[key] = issue.message;
    }
    return NextResponse.json({ error: "Проверьте поля формы", fields }, { status: 400 });
  }

  // Версию согласия ставит сервер по действующей политике, не доверяя клиенту.
  const result = await processRequest(parsed.data, config.legal.consentVersion, ip);
  if (result.kind === "limited") return NextResponse.json({ error: TOO_MANY }, { status: 429 });
  if (result.kind === "busy") return NextResponse.json({ error: BUSY }, { status: 503 });
  if (result.kind === "unknownKind") return NextResponse.json({ error: "Неизвестный вид обращения" }, { status: 400 });
  return NextResponse.json({ ok: true, id: result.id, duplicate: result.duplicate });
}
