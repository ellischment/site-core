// Постоянные редиректы со старых адресов (таблица Redirect). Страница, которая
// не нашла запись по адресу, сначала спрашивает здесь: адрес мог смениться,
// а ссылки на старый остались в поиске и у людей.

import type { Prisma } from "@prisma/client";
import { permanentRedirect, redirect } from "next/navigation";
import { prisma } from "./db";

export async function redirectIfMoved(path: string): Promise<void> {
  const row = await prisma.redirect.findUnique({ where: { from: path } });
  if (!row) return;
  if (row.permanent) permanentRedirect(row.to);
  redirect(row.to);
}

/**
 * Запомнить смену адреса внутри транзакции действия. Старые редиректы на
 * прежний адрес перенацеливаются, чтобы не было цепочек, и редирект на самого
 * себя удаляется (вернули старый адрес).
 */
export async function rememberMove(
  tx: Prisma.TransactionClient,
  from: string,
  to: string,
): Promise<void> {
  if (from === to) return;
  await tx.redirect.updateMany({ where: { to: from }, data: { to } });
  await tx.redirect.deleteMany({ where: { from: to } });
  await tx.redirect.upsert({ where: { from }, create: { from, to, permanent: true }, update: { to, permanent: true } });
}
