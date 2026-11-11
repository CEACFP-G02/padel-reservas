package com.g02.padel.user.usecase;

import com.g02.padel.shared.enums.Role;
import com.g02.padel.user.User;
import com.g02.padel.user.UserMapper;
import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.ClientResponse;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (owner): list clients (active and inactive), optionally those whose name, email or phone contains {@code search}. */
@Service
public class ListClientsUseCase {

    private final UserRepository userRepository;

    public ListClientsUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<ClientResponse> execute(String search, Pageable pageable) {
        Specification<User> filter = (user, query, cb) -> cb.equal(user.get("role"), Role.CLIENT);
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            filter = filter.and((user, query, cb) -> cb.or(
                    cb.like(cb.lower(user.get("name")), pattern),
                    cb.like(cb.lower(user.get("email")), pattern),
                    cb.like(cb.lower(user.get("phone")), pattern)));
        }
        return userRepository.findAll(filter, pageable).map(UserMapper::toClientResponse);
    }
}
