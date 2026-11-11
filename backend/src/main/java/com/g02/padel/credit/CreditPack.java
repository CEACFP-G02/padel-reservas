package com.g02.padel.credit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/** Prepaid pack of reservations. The four sizes (5, 10, 15, 20) are seeded by Flyway; only the price changes. */
@Entity
@Table(name = "credit_pack")
@Getter
@Setter
@NoArgsConstructor
public class CreditPack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Number of reservations in the pack. */
    @Column(name = "pack_size", nullable = false, unique = true, updatable = false)
    private int size;

    /** Total price of the pack, EUR. */
    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal price;
}
