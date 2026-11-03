package com.g02.padel.shared.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.servlet.FilterChain;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;
    @Mock
    private UserDetailsService userDetailsService;
    @Mock
    private FilterChain chain;

    private JwtAuthenticationFilter filter;
    private MockHttpServletRequest request;
    private final MockHttpServletResponse response = new MockHttpServletResponse();

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
        request = new MockHttpServletRequest("GET", "/api/v1/auth/me");
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatesAValidBearerTokenWithTheUsersRole() throws Exception {
        request.addHeader("Authorization", "Bearer good-token");
        when(jwtService.validateAccessToken("good-token")).thenReturn(Optional.of("ana@padel.test"));
        when(userDetailsService.loadUserByUsername("ana@padel.test")).thenReturn(principal(true));

        filter.doFilter(request, response, chain);

        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.isAuthenticated()).isTrue();
        assertThat(auth.getName()).isEqualTo("ana@padel.test");
        assertThat(auth.getAuthorities()).extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_CLIENT");
        verify(chain).doFilter(request, response);
    }

    @Test
    void leavesTheRequestAnonymousWithoutAnAuthorizationHeader() throws Exception {
        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(jwtService, never()).validateAccessToken(any());
        verify(chain).doFilter(request, response);
    }

    @Test
    void ignoresNonBearerSchemes() throws Exception {
        request.addHeader("Authorization", "Basic dXNlcjpwYXNz");

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(jwtService, never()).validateAccessToken(any());
        verify(chain).doFilter(request, response);
    }

    @Test
    void leavesTheRequestAnonymousWhenTheTokenIsInvalid() throws Exception {
        request.addHeader("Authorization", "Bearer bad-token");
        when(jwtService.validateAccessToken("bad-token")).thenReturn(Optional.empty());

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(userDetailsService, never()).loadUserByUsername(any());
        verify(chain).doFilter(request, response);
    }

    @Test
    void leavesTheRequestAnonymousWhenTheUserNoLongerExists() throws Exception {
        request.addHeader("Authorization", "Bearer good-token");
        when(jwtService.validateAccessToken("good-token")).thenReturn(Optional.of("gone@padel.test"));
        when(userDetailsService.loadUserByUsername("gone@padel.test")).thenThrow(new UsernameNotFoundException("x"));

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(request, response);
    }

    @Test
    void leavesTheRequestAnonymousWhenTheUserIsDeactivated() throws Exception {
        request.addHeader("Authorization", "Bearer good-token");
        when(jwtService.validateAccessToken("good-token")).thenReturn(Optional.of("ana@padel.test"));
        when(userDetailsService.loadUserByUsername("ana@padel.test")).thenReturn(principal(false));

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(request, response);
    }

    private static User principal(boolean enabled) {
        return (User) User.withUsername("ana@padel.test").password("$2a$hash").roles("CLIENT")
                .disabled(!enabled).build();
    }
}
