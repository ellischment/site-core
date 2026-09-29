// Некритичная подсказка про пригодность фото к обложке. Ничего не блокирует:
// файл загружается, админка лишь предупреждает, что кадр ляжет плохо.
// Пороги у мест разные, поэтому различия вынесены в описание места.

export type CoverShape = {
  /** Ниже этой ширины оригинал на большом экране заметно мылит. */
  minWidth: number;
  /** Уже этой пропорции: срежет верх и низ. */
  minRatio: number;
  /** Шире: срежет бока. */
  maxRatio: number;
  /** Как пропорция называется в подсказке: «4:3», «16:9». */
  ratioLabel: string;
  /** Где станет мыльно: «в карточке», «на странице». */
  where: string;
};

/** Карточка каталога или галереи: режется по центру до 4:3. */
export const CARD_COVER: CoverShape = { minWidth: 1200, minRatio: 1.15, maxRatio: 1.9, ratioLabel: "4:3", where: "в карточке" };

/** Обложка статьи: широкая, 16:9. */
export const ARTICLE_COVER: CoverShape = { minWidth: 1600, minRatio: 1.5, maxRatio: 2.1, ratioLabel: "16:9", where: "на странице" };

export function coverNotice(shape: CoverShape, name: string, width?: number | null, height?: number | null): string | null {
  if (!width || !height) return null;
  if (width < shape.minWidth) {
    return `${name}: ширина ${width}px, для обложки лучше от ${shape.minWidth}px, иначе ${shape.where} будет мыло`;
  }
  const ratio = width / height;
  if (ratio < shape.minRatio) return `${name}: кадр вертикальный (${width}×${height}px), обложка ${shape.ratioLabel} срежет верх и низ`;
  if (ratio > shape.maxRatio) return `${name}: кадр очень широкий (${width}×${height}px), обложка ${shape.ratioLabel} срежет бока`;
  return null;
}
