package com.g02.padel.credit;

import com.g02.padel.credit.dto.AddPaymentMethodRequest;
import com.g02.padel.credit.dto.PaymentMethodResponse;
import com.g02.padel.credit.dto.UpdatePaymentMethodRequest;
import com.g02.padel.credit.usecase.AddPaymentMethodUseCase;
import com.g02.padel.credit.usecase.ListPaymentMethodsUseCase;
import com.g02.padel.credit.usecase.RemovePaymentMethodUseCase;
import com.g02.padel.credit.usecase.SetDefaultPaymentMethodUseCase;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** The caller's own saved cards; CLIENT only. */
@RestController
@RequestMapping("/api/v1/payment-methods")
@PreAuthorize("hasRole('CLIENT')")
public class PaymentMethodController {

    private final AddPaymentMethodUseCase addMethod;
    private final ListPaymentMethodsUseCase listMethods;
    private final SetDefaultPaymentMethodUseCase setDefault;
    private final RemovePaymentMethodUseCase removeMethod;

    public PaymentMethodController(AddPaymentMethodUseCase addMethod, ListPaymentMethodsUseCase listMethods,
                                   SetDefaultPaymentMethodUseCase setDefault, RemovePaymentMethodUseCase removeMethod) {
        this.addMethod = addMethod;
        this.listMethods = listMethods;
        this.setDefault = setDefault;
        this.removeMethod = removeMethod;
    }

    @GetMapping
    public List<PaymentMethodResponse> list(Authentication authentication) {
        return listMethods.execute(authentication.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentMethodResponse add(Authentication authentication,
                                     @Valid @RequestBody AddPaymentMethodRequest request) {
        return addMethod.execute(authentication.getName(), request);
    }

    @PatchMapping("/{id}")
    public PaymentMethodResponse makeDefault(Authentication authentication, @PathVariable Long id,
                                             @RequestBody UpdatePaymentMethodRequest request) {
        if (!Boolean.TRUE.equals(request.makeDefault())) {
            throw new IllegalArgumentException("Only {\"default\": true} is supported");
        }
        return setDefault.execute(id, authentication.getName());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(Authentication authentication, @PathVariable Long id) {
        removeMethod.execute(id, authentication.getName());
    }
}
