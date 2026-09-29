// Маршрут модуля catalog: страница позиции.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/Button";
import { JsonLd } from "@/components/JsonLd";
import { config, isModuleEnabled } from "@/lib/config";
import { renderMarkdown } from "@/lib/markdown";
import { srcSet } from "@/lib/media";
import styles from "@/modules/catalog/components/catalog.module.css";
import { CATALOG_PATH, catalogTitle, getCatalogItem } from "@/modules/catalog/lib/data";
import { RequestBlock } from "@/modules/requests/components/RequestBlock";
import page from "../../page.module.css";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/catalog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCatalogItem(slug);
  if (!item) return {};
  return {
    title: item.seoTitle || item.title,
    description: item.seoDescription || item.short || undefined,
    alternates: { canonical: `${CATALOG_PATH}/${item.slug}` },
  };
}

export default async function Page({ params }: PageProps<"/catalog/[slug]">) {
  const { slug } = await params;
  const item = await getCatalogItem(slug);
  if (!item) notFound();

  const isService = config.modules.catalog?.mode !== "products";
  const jsonLd: Record<string, unknown> = {
    "@type": isService ? "Service" : "Product",
    name: item.title,
    ...(item.short ? { description: item.short } : {}),
    ...(isService ? { provider: { "@type": config.seo.businessType, name: config.name } } : {}),
    // Поле без значения не выводится: выдуманная цена хуже отсутствующей.
    ...(item.priceFrom ? { offers: { "@type": "Offer", price: item.priceFrom, priceCurrency: "RUB" } } : {}),
  };

  return (
    <main className={page.main}>
      <JsonLd items={[jsonLd]} />
      <p>
        <a href={CATALOG_PATH}>← {catalogTitle()}</a>
      </p>
      <h1>{item.title}</h1>
      <div className={styles.item}>
        <div className={styles.photos}>
          {item.photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- версии webp уже нарезаны, srcset свой
            <img key={p.id} src={p.path ?? ""} srcSet={srcSet(p.path)} sizes="(max-width: 800px) 100vw, 55vw" alt={p.alt ?? ""} width={p.width ?? undefined} height={p.height ?? undefined} loading={i === 0 ? "eager" : "lazy"} decoding="async" />
          ))}
        </div>
        <div>
          {item.priceText ? <p className={styles.price}>{item.priceText}</p> : null}
          {item.duration ? <p className={styles.short}>{item.duration}</p> : null}
          {item.short ? <p>{item.short}</p> : null}
          {isModuleEnabled("booking") && isService ? <ButtonLink href="/booking">Записаться</ButtonLink> : null}
          <div className={styles.prose} dangerouslySetInnerHTML={{ __html: renderMarkdown(item.description) }} />
          {isModuleEnabled("requests") && !(isModuleEnabled("booking") && isService) ? (
            <section aria-label="Заявка">
              <h2>Узнать подробнее</h2>
              <RequestBlock subject={item.title} />
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
