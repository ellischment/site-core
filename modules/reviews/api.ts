// Отзыв от гостя: POST /api/reviews. Сохраняется на модерацию, на сайте
// появляется только после одобрения в админке.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { RATE_MAX, RATE_MINUTES, reviewSchema } from "./lib/data";

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request): Promise<Response> {
  const ip = clientIp(req);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form";
      if (!fields[key]) fields[key] = issue.message;
    }
    return NextResponse.json({ error: "Проверьте поля формы", fields }, { status: 400 });
  }

  const since = new Date(Date.now() - RATE_MINUTES * 60_000);
  // Счёт и запись в одной транзакции: одновременные отправки не проскочат лимит.
  const saved = await prisma.$transaction(async (tx) => {
    if ((await tx.review.count({ where: { ip, createdAt: { gte: since } } })) >= RATE_MAX) return null;
    return tx.review.create({
      data: {
        authorName: parsed.data.authorName,
        text: parsed.data.text,
        rating: parsed.data.rating ?? null,
        source: "site",
        status: "pending",
        consentAt: new Date(),
        ip,
      },
    });
  });
  if (!saved) return NextResponse.json({ error: "Слишком много отзывов с этого устройства. Попробуйте позже." }, { status: 429 });
  return NextResponse.json({ ok: true });
}
