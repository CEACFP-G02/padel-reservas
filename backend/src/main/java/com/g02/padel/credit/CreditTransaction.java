package com.g02.padel.credit;

import com.g02.padel.shared.enums.CreditTransactionType;
import com.g02.padel.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * One movement in a client's credit ledger (1 credit = 1 prepaid reservation). A purchase records what was
 * charged, for which pack size, to which card and the gateway charge reference.
 */
@Entity
@Table(name = "credit_transaction")
@Getter
@Setter
@NoArgsConstructor
public class CreditTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, updatable = false)
    private CreditTransactionType type;

    /** Change in the balance: positive for a purchase, negative for a consumption. */
    @Column(nullable = false, updatable = false)
    private int credits;

    /** Money charged for a purchase (EUR); null for a consumption. */
    @Column(precision = 8, scale = 2, updatable = false)
    private BigDecimal amount;

    @Column(name = "pack_size", updatable = false)
    private Integer packSize;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_method_id", updatable = false)
    private PaymentMethod paymentMethod;

    /** The gateway's reference of the charge; null when nothing was charged. */
    @Column(name = "charge_reference", length = 100, updatable = false)
    private String chargeReference;

    /** UTC. */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now(ZoneOffset.UTC);
}
