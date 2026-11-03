package com.g02.padel.shared.web;

import org.springframework.data.domain.Page;

import java.util.List;

/** Paginated list body (docs/api.md#conventions); Spring Data's own {@code Page} JSON shape differs. */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {

    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(),
                page.getTotalPages());
    }
}
