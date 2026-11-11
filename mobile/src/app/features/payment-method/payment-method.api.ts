import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AddPaymentMethodRequest, PaymentMethod } from '../../shared/models';

/** REST client for docs/api.md#payment-methods--apiv1payment-methods. */
@Injectable({ providedIn: 'root' })
export class PaymentMethodApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/payment-methods`;

  list(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(this.baseUrl);
  }

  add(body: AddPaymentMethodRequest): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(this.baseUrl, body);
  }

  makeDefault(id: number): Observable<PaymentMethod> {
    return this.http.patch<PaymentMethod>(`${this.baseUrl}/${id}`, { default: true });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
