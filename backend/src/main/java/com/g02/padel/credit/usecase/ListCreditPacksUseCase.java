package com.g02.padel.credit.usecase;

import com.g02.padel.credit.CreditPackMapper;
import com.g02.padel.credit.CreditPackRepository;
import com.g02.padel.credit.dto.CreditPackResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (owner): list the credit packs, by size. */
@Service
public class ListCreditPacksUseCase {

    private final CreditPackRepository creditPackRepository;

    public ListCreditPacksUseCase(CreditPackRepository creditPackRepository) {
        this.creditPackRepository = creditPackRepository;
    }

    @Transactional(readOnly = true)
    public List<CreditPackResponse> execute() {
        return creditPackRepository.findAllByOrderBySizeAsc().stream()
                .map(CreditPackMapper::toResponse)
                .toList();
    }
}
