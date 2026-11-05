package com.g02.padel.availability;

import java.time.LocalTime;

/** One slot of a court's day: {@code [start, end)}, free or taken. */
public record DaySlot(LocalTime start, LocalTime end, boolean free) {
}
