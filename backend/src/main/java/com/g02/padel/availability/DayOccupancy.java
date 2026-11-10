package com.g02.padel.availability;

/** A court's day: slots that can be booked (schedule minus blocks) and how many of them are booked. */
public record DayOccupancy(int bookableSlots, int bookedSlots) {
}
