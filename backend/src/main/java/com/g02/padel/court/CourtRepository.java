package com.g02.padel.court;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CourtRepository extends JpaRepository<Court, Long>, JpaSpecificationExecutor<Court> {

    List<Court> findByActiveTrue();

    /** Locks the court row for the rest of the transaction, serializing bookings on that court. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Court c WHERE c.id = :id")
    Optional<Court> findByIdForUpdate(@Param("id") Long id);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
