package com.g02.padel.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/** Reads "Authorization: Bearer <token>" and populates the SecurityContext. */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        // TODO: if Bearer header present and jwtService.isValid(token), load user by subject and set
        //  UsernamePasswordAuthenticationToken with authority Role.valueOf(claim).authority() (e.g. ROLE_OWNER)
        //  — see docs/api.md#authentication
        chain.doFilter(request, response);
    }
}
