package com.g02.padel.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {

    List<Booking> findByCourtIdAndDate(Long courtId, LocalDate date);

    List<Booking> findByUserId(Long userId);

    List<Booking> findByDateBetween(LocalDate from, LocalDate to);
}
