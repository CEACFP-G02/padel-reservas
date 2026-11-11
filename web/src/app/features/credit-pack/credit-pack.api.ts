import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreditPack, UpdateCreditPackPriceRequest } from '../../shared/models';

/** REST client for `/credit-packs` — see docs/api.md#credit-packs--apiv1credit-packs. */
@Injectable({ providedIn: 'root' })
export class CreditPackApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/credit-packs`;

  /** The four packs, sorted by size (not paginated). */
  list(): Observable<CreditPack[]> {
    return this.http.get<CreditPack[]>(this.baseUrl);
  }

  updatePrice(id: number, price: number): Observable<CreditPack> {
    const body: UpdateCreditPackPriceRequest = { price };
    return this.http.patch<CreditPack>(`${this.baseUrl}/${id}`, body);
  }
}
