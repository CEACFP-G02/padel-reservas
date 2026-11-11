import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreditPack,
  CreditTransaction,
  CreditTransactionsQuery,
  PageResponse,
  PurchaseCreditsRequest,
  PurchaseResponse,
} from '../../shared/models';
import { toHttpParams } from '../../shared/util/http-params';

/** REST client for docs/api.md#credits--apiv1credit and the packs list (#credit-packs--apiv1credit-packs). */
@Injectable({ providedIn: 'root' })
export class WalletApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  balance(): Observable<{ balance: number }> {
    return this.http.get<{ balance: number }>(`${this.baseUrl}/credit/balance`);
  }

  transactions(query: CreditTransactionsQuery = {}): Observable<PageResponse<CreditTransaction>> {
    return this.http.get<PageResponse<CreditTransaction>>(`${this.baseUrl}/credit/transactions`, {
      params: toHttpParams(query),
    });
  }

  packs(): Observable<CreditPack[]> {
    return this.http.get<CreditPack[]>(`${this.baseUrl}/credit-packs`);
  }

  purchase(body: PurchaseCreditsRequest): Observable<PurchaseResponse> {
    return this.http.post<PurchaseResponse>(`${this.baseUrl}/credit/purchases`, body);
  }
}
