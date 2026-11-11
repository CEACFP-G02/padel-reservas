package com.g02.padel.credit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {

    List<PaymentMethod> findByUserIdAndActiveTrueOrderByIdAsc(Long userId);

    Optional<PaymentMethod> findByIdAndUserIdAndActiveTrue(Long id, Long userId);

    boolean existsByUserIdAndActiveTrue(Long userId);
}
