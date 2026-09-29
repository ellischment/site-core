export const REQUEST_STATUSES = ["new", "work", "done", "spam"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const STATUS_TITLES: Record<RequestStatus, string> = {
  new: "Новая",
  work: "В работе",
  done: "Закрыта",
  spam: "Спам",
};

export const NOTIFY_TITLES: Record<string, string> = {
  pending: "отправляется",
  sent: "уведомление ушло",
  failed: "уведомление не ушло",
  off: "без уведомления",
};
