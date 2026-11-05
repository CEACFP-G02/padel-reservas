package com.g02.padel.booking;

import com.g02.padel.shared.enums.BookingStatus;
import java.time.LocalDate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

/** Optional filters for booking lists; a null value means "any". */
public final class BookingSpecifications {

    /** Most recent first, unless the caller asked for another order. */
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Order.desc("date"), Sort.Order.desc("id"));

    private BookingSpecifications() {
    }

    public static Specification<Booking> filter(Long userId, Long courtId, BookingStatus status,
                                                LocalDate from, LocalDate to) {
        return Specification.<Booking>where(null)
                .and(userId == null ? null : (root, q, cb) -> cb.equal(root.get("user").get("id"), userId))
                .and(courtId == null ? null : (root, q, cb) -> cb.equal(root.get("court").get("id"), courtId))
                .and(status == null ? null : (root, q, cb) -> cb.equal(root.get("status"), status))
                .and(from == null ? null : (root, q, cb) -> cb.greaterThanOrEqualTo(root.get("date"), from))
                .and(to == null ? null : (root, q, cb) -> cb.lessThanOrEqualTo(root.get("date"), to));
    }

    public static Pageable withDefaultSort(Pageable pageable) {
        return pageable.getSort().isSorted()
                ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), DEFAULT_SORT);
    }
}
