import { SpanishPaginatorIntl } from './spanish-paginator-intl';

describe('SpanishPaginatorIntl', () => {
  const intl = new SpanishPaginatorIntl();

  it('labels the paginator controls in Spanish', () => {
    expect(intl.itemsPerPageLabel).toBe('Elementos por página');
    expect(intl.previousPageLabel).toBe('Página anterior');
    expect(intl.nextPageLabel).toBe('Página siguiente');
    expect(intl.firstPageLabel).toBe('Primera página');
    expect(intl.lastPageLabel).toBe('Última página');
  });

  it('describes the visible range as "X–Y de Z"', () => {
    expect(intl.getRangeLabel(0, 20, 45)).toBe('1–20 de 45');
    expect(intl.getRangeLabel(2, 20, 45)).toBe('41–45 de 45');
    expect(intl.getRangeLabel(0, 10, 3)).toBe('1–3 de 3');
  });

  it('says "0 de Z" when there is nothing to show', () => {
    expect(intl.getRangeLabel(0, 20, 0)).toBe('0 de 0');
    expect(intl.getRangeLabel(0, 0, 12)).toBe('0 de 12');
  });

  it('keeps the range within the page when the page index is past the end', () => {
    expect(intl.getRangeLabel(5, 10, 20)).toBe('51–60 de 20');
  });
});
