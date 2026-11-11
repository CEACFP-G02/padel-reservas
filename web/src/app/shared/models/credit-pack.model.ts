/** A prepaid pack of reservations (docs/api.md#credit-packs--apiv1credit-packs). `size` is read-only. */
export interface CreditPack {
  id: number;
  /** Reservations in the pack: 5, 10, 15 or 20. */
  size: number;
  /** EUR, total price of the pack. */
  price: number;
}

/** PATCH body: only the price can change. */
export interface UpdateCreditPackPriceRequest {
  price: number;
}
