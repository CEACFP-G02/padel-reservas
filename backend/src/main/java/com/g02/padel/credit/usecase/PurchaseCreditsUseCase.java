package com.g02.padel.credit.usecase;

import com.g02.padel.credit.CreditPack;
import com.g02.padel.credit.CreditPackRepository;
import com.g02.padel.credit.CreditTransaction;
import com.g02.padel.credit.CreditTransactionMapper;
import com.g02.padel.credit.CreditTransactionRepository;
import com.g02.padel.credit.PaymentMethod;
import com.g02.padel.credit.PaymentMethodRepository;
import com.g02.padel.credit.dto.PurchaseCreditsRequest;
import com.g02.padel.credit.dto.PurchaseResponse;
import com.g02.padel.credit.gateway.ChargeResult;
import com.g02.padel.credit.gateway.ChargeStatus;
import com.g02.padel.credit.gateway.PaymentGateway;
import com.g02.padel.shared.enums.CreditTransactionType;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.shared.exception.PaymentDeclinedException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UC (client): buy a credit pack with one of their cards. The pack's current price is charged through the
 * gateway; if approved, a PURCHASE adds the pack's size to the balance. A declined charge adds nothing (402).
 */
@Service
public class PurchaseCreditsUseCase {

    private final CreditPackRepository creditPackRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final CreditTransactionRepository creditTransactionRepository;
    private final UserRepository userRepository;
    private final PaymentGateway paymentGateway;
    private final Clock clock;

    public PurchaseCreditsUseCase(CreditPackRepository creditPackRepository,
                                  PaymentMethodRepository paymentMethodRepository,
                                  CreditTransactionRepository creditTransactionRepository,
                                  UserRepository userRepository, PaymentGateway paymentGateway, Clock clock) {
        this.creditPackRepository = creditPackRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.creditTransactionRepository = creditTransactionRepository;
        this.userRepository = userRepository;
        this.paymentGateway = paymentGateway;
        this.clock = clock;
    }

    @Transactional
    public PurchaseResponse execute(String requesterEmail, PurchaseCreditsRequest request) {
        User user = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> NotFoundException.of("User", requesterEmail));
        CreditPack pack = creditPackRepository.findById(request.packId())
                .orElseThrow(() -> NotFoundException.of("Credit pack", request.packId()));
        PaymentMethod card = paymentMethodRepository
                .findByIdAndUserIdAndActiveTrue(request.paymentMethodId(), user.getId())
                .orElseThrow(() -> NotFoundException.of("Payment method", request.paymentMethodId()));

        String chargeReference = null;
        // A free pack is not charged (the gateway only takes positive amounts).
        if (pack.getPrice().signum() > 0) {
            ChargeResult charge = paymentGateway.charge(card.getGatewayToken(), pack.getPrice());
            if (charge.status() != ChargeStatus.APPROVED) {
                throw new PaymentDeclinedException();
            }
            chargeReference = charge.reference();
        }

        CreditTransaction purchase = new CreditTransaction();
        purchase.setUser(user);
        purchase.setType(CreditTransactionType.PURCHASE);
        purchase.setCredits(pack.getSize());
        purchase.setAmount(pack.getPrice());
        purchase.setPackSize(pack.getSize());
        purchase.setPaymentMethod(card);
        purchase.setChargeReference(chargeReference);
        purchase.setCreatedAt(LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC));
        CreditTransaction saved = creditTransactionRepository.save(purchase);

        return new PurchaseResponse(creditTransactionRepository.sumCreditsByUserId(user.getId()),
                CreditTransactionMapper.toResponse(saved));
    }
}
