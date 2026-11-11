package com.g02.padel.credit.usecase;

import com.g02.padel.credit.PaymentMethod;
import com.g02.padel.credit.PaymentMethodMapper;
import com.g02.padel.credit.PaymentMethodRepository;
import com.g02.padel.credit.dto.PaymentMethodResponse;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (client): make one of the caller's cards the default; their previous default stops being it. */
@Service
public class SetDefaultPaymentMethodUseCase {

    private final PaymentMethodRepository paymentMethodRepository;
    private final UserRepository userRepository;

    public SetDefaultPaymentMethodUseCase(PaymentMethodRepository paymentMethodRepository,
                                          UserRepository userRepository) {
        this.paymentMethodRepository = paymentMethodRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public PaymentMethodResponse execute(Long id, String requesterEmail) {
        User user = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> NotFoundException.of("User", requesterEmail));
        PaymentMethod chosen = paymentMethodRepository.findByIdAndUserIdAndActiveTrue(id, user.getId())
                .orElseThrow(() -> NotFoundException.of("Payment method", id));
        for (PaymentMethod method : paymentMethodRepository.findByUserIdAndActiveTrueOrderByIdAsc(user.getId())) {
            method.setDefaultMethod(method.getId().equals(chosen.getId()));
        }
        chosen.setDefaultMethod(true);
        return PaymentMethodMapper.toResponse(chosen);
    }
}
