package com.g02.padel.credit.usecase;

import com.g02.padel.credit.PaymentMethod;
import com.g02.padel.credit.PaymentMethodMapper;
import com.g02.padel.credit.PaymentMethodRepository;
import com.g02.padel.credit.dto.AddPaymentMethodRequest;
import com.g02.padel.credit.dto.PaymentMethodResponse;
import com.g02.padel.credit.gateway.PaymentGateway;
import com.g02.padel.credit.gateway.TokenizedCard;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UC (client): save a card. The gateway tokenises it and only the token and safe details are stored — never the
 * card number. The client's first method becomes the default.
 */
@Service
public class AddPaymentMethodUseCase {

    private final PaymentMethodRepository paymentMethodRepository;
    private final UserRepository userRepository;
    private final PaymentGateway paymentGateway;

    public AddPaymentMethodUseCase(PaymentMethodRepository paymentMethodRepository, UserRepository userRepository,
                                   PaymentGateway paymentGateway) {
        this.paymentMethodRepository = paymentMethodRepository;
        this.userRepository = userRepository;
        this.paymentGateway = paymentGateway;
    }

    @Transactional
    public PaymentMethodResponse execute(String requesterEmail, AddPaymentMethodRequest request) {
        User user = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> NotFoundException.of("User", requesterEmail));
        TokenizedCard card = paymentGateway.tokenize(request.cardNumber(), request.expiry(), request.holder());

        PaymentMethod method = new PaymentMethod();
        method.setUser(user);
        method.setBrand(card.brand());
        method.setLast4(card.last4());
        method.setExpMonth(request.expiry().getMonthValue());
        method.setExpYear(request.expiry().getYear());
        method.setGatewayToken(card.token());
        method.setDefaultMethod(!paymentMethodRepository.existsByUserIdAndActiveTrue(user.getId()));
        return PaymentMethodMapper.toResponse(paymentMethodRepository.save(method));
    }
}
