package com.g02.padel.credit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CreditPackRepository extends JpaRepository<CreditPack, Long> {

    List<CreditPack> findAllByOrderBySizeAsc();
}
