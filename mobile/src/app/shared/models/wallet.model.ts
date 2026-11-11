import { IsoTimestamp, PageRequest } from './common';

/** A prepaid pack (docs/api.md#credit-packs--apiv1credit-packs): `size` reservations for `price` EUR. */
export interface CreditPack {
  id: number;
  size: number;
  price: number;
}

/** A pack as offered in the wallet, with its price per reservation (EUR, rounded to cents). */
export interface CreditPackOffer extends CreditPack {
  pricePerReservation: number;
}

export type CardBrand = 'VISA' | 'MASTERCARD' | 'AMEX' | 'OTHER';

/** A saved card: never the full number, only brand and last 4 digits. */
export interface PaymentMethod {
  id: number;
  brand: CardBrand;
  last4: string;
  /** `YYYY-MM`. */
  expiry: string;
  default: boolean;
}

/** POST /payment-methods. Sent once to be tokenised by the gateway; never kept in the app. */
export interface AddPaymentMethodRequest {
  cardNumber: string;
  expiry: string;
  holder: string;
}

export type CreditTransactionType = 'PURCHASE' | 'CONSUMPTION';

export interface CreditTransaction {
  id: number;
  type: CreditTransactionType;
  /** Positive for a purchase, negative for a consumption. */
  credits: number;
  amount: number | null;
  packSize: number | null;
  paymentMethodId: number | null;
  createdAt: IsoTimestamp;
}

export interface PurchaseCreditsRequest {
  packId: number;
  paymentMethodId: number;
}

export interface PurchaseResponse {
  balance: number;
  transaction: CreditTransaction;
}

export type CreditTransactionsQuery = PageRequest;
