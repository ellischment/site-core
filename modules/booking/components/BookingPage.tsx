import { config } from "@/lib/config";
import { TZ } from "@/lib/time";
import { bookingSettings, locations, serviceLocations, visibleServices } from "../lib/data";
import { bookableDates } from "../lib/slots";
import { BookingWidget } from "./BookingWidget";

export async function BookingPage() {
  const services = await visibleServices();
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
  const dates = bookableDates(now, bookingSettings().horizonDays, TZ).map((key) => ({ key, label: fmt.format(new Date(`${key}T12:00:00Z`)) }));
  const channels = config.modules.requests?.channels ?? ["call", "telegram"];

  return (
    <BookingWidget
      services={services.map((s) => ({ id: s.id, title: s.title, durationMin: s.durationMin, priceText: s.priceText, description: s.description, locationIds: serviceLocations(s.locationIds) }))}
      locations={locations().map((l) => ({ id: l.id, title: l.title, address: l.address, online: l.online }))}
      dates={dates}
      channels={channels}
    />
  );
}
