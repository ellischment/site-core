// Защищённый адрес для системного планировщика. Cron на сервере дёргает его
// по расписанию с секретным ключом (строки crontab в DEPLOY.md):
//
//   /api/cron?task=prune-personal   уборка персональных данных (раз в час)
//   задачи модулей: см. modules/<id>/module.ts
//
// Ключ передаётся заголовком x-cron-secret или Authorization: Bearer <ключ>.
// Резервные копии делаются скриптами на сервере (scripts/backup.sh), не здесь:
// им нужна файловая система сервера, а не HTTP.

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { cronTasks } from "@/lib/cron";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const provided = req.headers.get("x-cron-secret") ?? bearer ?? "";

  // Сравнение постоянного времени: длины должны совпасть, иначе timingSafeEqual бросает.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(req: Request): Promise<Response> {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("task");
  const tasks = cronTasks();
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return NextResponse.json({ error: "Неизвестная задача", supported: tasks.map((t) => t.id) }, { status: 400 });
  }

  const result = await task.run();
  return NextResponse.json({ task: task.id, result });
}

export async function GET(req: Request): Promise<Response> {
  return handle(req);
}

export async function POST(req: Request): Promise<Response> {
  return handle(req);
}
