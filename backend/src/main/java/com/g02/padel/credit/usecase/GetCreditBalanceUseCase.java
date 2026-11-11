package com.g02.padel.credit.usecase;

import com.g02.padel.credit.CreditTransactionRepository;
import com.g02.padel.credit.dto.CreditBalanceResponse;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (client): the caller's credit balance, the sum of their credit transactions. */
@Service
public class GetCreditBalanceUseCase {

    private final CreditTransactionRepository creditTransactionRepository;
    private final UserRepository userRepository;

    public GetCreditBalanceUseCase(CreditTransactionRepository creditTransactionRepository,
                                   UserRepository userRepository) {
        this.creditTransactionRepository = creditTransactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public CreditBalanceResponse execute(String requesterEmail) {
        User user = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> NotFoundException.of("User", requesterEmail));
        return new CreditBalanceResponse(creditTransactionRepository.sumCreditsByUserId(user.getId()));
    }
}
