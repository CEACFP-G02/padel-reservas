import { Injectable, Provider } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

/** Spanish texts for every Material paginator: `Elementos por página`, `1–20 de 45`, `0 de 0`. */
@Injectable()
export class SpanishPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Elementos por página';
  override nextPageLabel = 'Página siguiente';
  override previousPageLabel = 'Página anterior';
  override firstPageLabel = 'Primera página';
  override lastPageLabel = 'Última página';

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return `0 de ${length}`;
    }
    const start = page * pageSize;
    // Past the last page (e.g. while a smaller result arrives) the range follows the page, as Material does.
    const end = start < length ? Math.min(start + pageSize, length) : start + pageSize;
    return `${start + 1}–${end} de ${length}`;
  };
}

/**
 * Registers the Spanish paginator texts. Provided by the authenticated shell (every table lives under it) rather
 * than at the root, so the paginator code stays out of the initial bundle.
 */
export function provideSpanishPaginator(): Provider[] {
  return [{ provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl }];
}
