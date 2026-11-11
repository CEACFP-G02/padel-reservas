package com.g02.padel.credit;

import com.g02.padel.credit.dto.CreditBalanceResponse;
import com.g02.padel.credit.dto.CreditTransactionResponse;
import com.g02.padel.credit.dto.PurchaseCreditsRequest;
import com.g02.padel.credit.dto.PurchaseResponse;
import com.g02.padel.credit.usecase.GetCreditBalanceUseCase;
import com.g02.padel.credit.usecase.ListCreditTransactionsUseCase;
import com.g02.padel.credit.usecase.PurchaseCreditsUseCase;
import com.g02.padel.shared.web.PageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** The caller's own credits: buy packs, balance and history; CLIENT only. */
@RestController
@RequestMapping("/api/v1/credit")
@PreAuthorize("hasRole('CLIENT')")
public class CreditController {

    private final PurchaseCreditsUseCase purchaseCredits;
    private final GetCreditBalanceUseCase getBalance;
    private final ListCreditTransactionsUseCase listTransactions;

    public CreditController(PurchaseCreditsUseCase purchaseCredits, GetCreditBalanceUseCase getBalance,
                            ListCreditTransactionsUseCase listTransactions) {
        this.purchaseCredits = purchaseCredits;
        this.getBalance = getBalance;
        this.listTransactions = listTransactions;
    }

    @PostMapping("/purchases")
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseResponse purchase(Authentication authentication,
                                     @Valid @RequestBody PurchaseCreditsRequest request) {
        return purchaseCredits.execute(authentication.getName(), request);
    }

    @GetMapping("/balance")
    public CreditBalanceResponse balance(Authentication authentication) {
        return getBalance.execute(authentication.getName());
    }

    @GetMapping("/transactions")
    public PageResponse<CreditTransactionResponse> transactions(Authentication authentication,
                                                                @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.of(listTransactions.execute(authentication.getName(), pageable));
    }
}
