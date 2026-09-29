// API записи: GET /api/booking?service&location&date → свободное время,
// POST /api/booking → создать запись. Публичные адреса.

import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { prisma } from "@/lib/db";
import { slotsFor } from "./lib/data";
import { createBooking, RATE_MAX, RATE_MINUTES } from "./lib/pipeline";
import { bookingSchema } from "./lib/validation";

const TOO_MANY = "Слишком много записей с этого устройства. Попробуйте через несколько минут.";

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const service = url.searchParams.get("service") ?? "";
  const location = url.searchParams.get("location") ?? "";
  const date = url.searchParams.get("date") ?? "";
  if (!service || !location || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Нужны услуга, место и дата" }, { status: 400 });
  }
  return NextResponse.json({ slots: await slotsFor(service, location, date) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request): Promise<Response> {
  const ip = clientIp(req);
  const since = new Date(Date.now() - RATE_MINUTES * 60_000);
  if ((await prisma.booking.count({ where: { ip, createdAt: { gte: since } } })) >= RATE_MAX) {
    return NextResponse.json({ error: TOO_MANY }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form";
      if (!fields[key]) fields[key] = issue.message;
    }
    return NextResponse.json({ error: "Проверьте поля формы", fields }, { status: 400 });
  }

  const result = await createBooking(parsed.data, config.legal.consentVersion, ip);
  if (result.kind === "limited") return NextResponse.json({ error: TOO_MANY }, { status: 429 });
  if (result.kind === "busy") return NextResponse.json({ error: "Сейчас много записей, попробуйте через минуту." }, { status: 503 });
  if (result.kind === "taken") return NextResponse.json({ error: "Это время уже заняли. Выберите другое." }, { status: 409 });
  return NextResponse.json({ ok: true, id: result.id });
}
