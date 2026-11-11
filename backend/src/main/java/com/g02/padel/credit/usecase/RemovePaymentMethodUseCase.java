package com.g02.padel.credit.usecase;

import com.g02.padel.credit.PaymentMethod;
import com.g02.padel.credit.PaymentMethodRepository;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UC (client): remove one of the caller's cards (soft: it is deactivated). Removing the default leaves the
 * client without a default until they choose one.
 */
@Service
public class RemovePaymentMethodUseCase {

    private final PaymentMethodRepository paymentMethodRepository;
    private final UserRepository userRepository;

    public RemovePaymentMethodUseCase(PaymentMethodRepository paymentMethodRepository,
                                      UserRepository userRepository) {
        this.paymentMethodRepository = paymentMethodRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void execute(Long id, String requesterEmail) {
        User user = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> NotFoundException.of("User", requesterEmail));
        PaymentMethod method = paymentMethodRepository.findByIdAndUserIdAndActiveTrue(id, user.getId())
                .orElseThrow(() -> NotFoundException.of("Payment method", id));
        method.setActive(false);
        method.setDefaultMethod(false);
    }
}
