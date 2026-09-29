// Отдаёт загруженные фото, читая их с диска на каждый запрос.
//
// Next в режиме standalone составляет список файлов public/ при старте и дальше
// отдаёт только их. Загрузки попадают в uploads уже после запуска, в списке их
// нет, и без этого маршрута свежее фото отвечало бы 404 до перезапуска.
// Файлы, известные при старте, по-прежнему отдаёт быстрый статический обработчик.
// Имена файлов uuid и никогда не переписываются, поэтому кэш вечный.

import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { uploadRoot } from "@/lib/media";

// Только то, что кладёт наш конвейер: каталог общий с томом, превращать его в
// раздачу произвольных файлов не нужно.
const TYPES: Record<string, string> = { ".webp": "image/webp" };

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path: parts } = await params;
  const root = uploadRoot();
  // Защита от выхода из каталога: проверяем итоговый путь, а не вид сегментов.
  const target = path.resolve(/*turbopackIgnore: true*/ root, ...parts);
  if (!target.startsWith(root + path.sep)) return new NextResponse("Не найдено", { status: 404 });

  const type = TYPES[path.extname(target).toLowerCase()];
  if (!type) return new NextResponse("Не найдено", { status: 404 });

  try {
    const info = await stat(/*turbopackIgnore: true*/ target);
    if (!info.isFile()) return new NextResponse("Не найдено", { status: 404 });
    const body = await readFile(/*turbopackIgnore: true*/ target);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: `"${createHash("sha1").update(body).digest("hex")}"`,
      },
    });
  } catch {
    return new NextResponse("Не найдено", { status: 404 });
  }
}
