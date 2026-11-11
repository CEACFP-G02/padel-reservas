package com.g02.padel.credit.usecase;

import com.g02.padel.credit.CreditTransactionMapper;
import com.g02.padel.credit.CreditTransactionRepository;
import com.g02.padel.credit.dto.CreditTransactionResponse;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (client): the caller's credit transactions, most recent first (a requested sort is ignored). */
@Service
public class ListCreditTransactionsUseCase {

    private final CreditTransactionRepository creditTransactionRepository;
    private final UserRepository userRepository;

    public ListCreditTransactionsUseCase(CreditTransactionRepository creditTransactionRepository,
                                         UserRepository userRepository) {
        this.creditTransactionRepository = creditTransactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<CreditTransactionResponse> execute(String requesterEmail, Pageable pageable) {
        User user = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> NotFoundException.of("User", requesterEmail));
        Pageable page = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        return creditTransactionRepository.findByUserIdOrderByCreatedAtDescIdDesc(user.getId(), page)
                .map(CreditTransactionMapper::toResponse);
    }
}
