package com.g02.padel.credit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CreditTransactionRepository extends JpaRepository<CreditTransaction, Long> {

    /** The client's balance: the running sum of their transactions ({@code 0} without any). */
    @Query("SELECT COALESCE(SUM(t.credits), 0) FROM CreditTransaction t WHERE t.user.id = :userId")
    long sumCreditsByUserId(@Param("userId") Long userId);

    Page<CreditTransaction> findByUserIdOrderByCreatedAtDescIdDesc(Long userId, Pageable pageable);
}
