package com.g02.padel.schedule;

import com.g02.padel.court.Court;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** Weekly opening schedule of a court (one per court). */
@Entity
@Table(name = "schedule")
@Getter
@Setter
@NoArgsConstructor
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "court_id", nullable = false, unique = true)
    private Court court;

    @Column(name = "slot_duration_minutes", nullable = false)
    private int slotMinutes;

    /** Price of one slot. */
    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal price;

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OpeningHours> openingHours = new ArrayList<>();

    public void addOpeningHours(OpeningHours hours) {
        openingHours.add(hours);
        hours.setSchedule(this);
    }
}
