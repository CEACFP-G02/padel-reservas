package com.g02.padel.credit.usecase;

import com.g02.padel.credit.CreditPack;
import com.g02.padel.credit.CreditPackMapper;
import com.g02.padel.credit.CreditPackRepository;
import com.g02.padel.credit.dto.CreditPackResponse;
import com.g02.padel.credit.dto.UpdateCreditPackPriceRequest;
import com.g02.padel.shared.exception.NotFoundException;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (owner): set the total price of a credit pack; its size never changes. */
@Service
public class UpdateCreditPackPriceUseCase {

    private final CreditPackRepository creditPackRepository;

    public UpdateCreditPackPriceUseCase(CreditPackRepository creditPackRepository) {
        this.creditPackRepository = creditPackRepository;
    }

    @Transactional
    public CreditPackResponse execute(Long id, UpdateCreditPackPriceRequest request) {
        CreditPack pack = creditPackRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Credit pack", id));
        // The request is validated to at most 2 decimals, so this only normalises the scale (70 -> 70.00).
        pack.setPrice(request.price().setScale(2, RoundingMode.UNNECESSARY));
        return CreditPackMapper.toResponse(pack);
    }
}
