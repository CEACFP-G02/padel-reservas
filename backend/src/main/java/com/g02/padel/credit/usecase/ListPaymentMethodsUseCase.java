package com.g02.padel.credit.usecase;

import com.g02.padel.credit.PaymentMethod;
import com.g02.padel.credit.PaymentMethodMapper;
import com.g02.padel.credit.PaymentMethodRepository;
import com.g02.padel.credit.dto.PaymentMethodResponse;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (client): list the caller's saved cards, the default first, then in the order they were added. */
@Service
public class ListPaymentMethodsUseCase {

    private final PaymentMethodRepository paymentMethodRepository;
    private final UserRepository userRepository;

    public ListPaymentMethodsUseCase(PaymentMethodRepository paymentMethodRepository, UserRepository userRepository) {
        this.paymentMethodRepository = paymentMethodRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<PaymentMethodResponse> execute(String requesterEmail) {
        User user = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> NotFoundException.of("User", requesterEmail));
        return paymentMethodRepository.findByUserIdAndActiveTrueOrderByIdAsc(user.getId()).stream()
                .sorted(Comparator.comparing((PaymentMethod method) -> !method.isDefaultMethod()))
                .map(PaymentMethodMapper::toResponse)
                .toList();
    }
}
