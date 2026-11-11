package com.g02.padel.credit;

import com.g02.padel.credit.dto.CreditPackResponse;
import com.g02.padel.credit.dto.UpdateCreditPackPriceRequest;
import com.g02.padel.credit.usecase.ListCreditPacksUseCase;
import com.g02.padel.credit.usecase.UpdateCreditPackPriceUseCase;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/credit-packs")
public class CreditPackController {

    private final ListCreditPacksUseCase listPacks;
    private final UpdateCreditPackPriceUseCase updatePrice;

    public CreditPackController(ListCreditPacksUseCase listPacks, UpdateCreditPackPriceUseCase updatePrice) {
        this.listPacks = listPacks;
        this.updatePrice = updatePrice;
    }

    /** A client lists the packs to buy one (see /credit/purchases). */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'CLIENT')")
    public List<CreditPackResponse> list() {
        return listPacks.execute();
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public CreditPackResponse updatePrice(@PathVariable Long id,
                                          @Valid @RequestBody UpdateCreditPackPriceRequest request) {
        return updatePrice.execute(id, request);
    }
}
