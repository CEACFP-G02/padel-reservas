package com.g02.padel.availability.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

/** A slot with enough free courts; {@code courtsFree == courtIds.size()}. The client books one of {@code courtIds}. */
public record SlotResponse(
        @JsonFormat(pattern = "HH:mm") LocalTime start,
        @JsonFormat(pattern = "HH:mm") LocalTime end,
        int courtsFree,
        List<Long> courtIds,
        BigDecimal price
) {
}
