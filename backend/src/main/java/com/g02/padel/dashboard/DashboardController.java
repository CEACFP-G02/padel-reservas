package com.g02.padel.dashboard;

import com.g02.padel.dashboard.dto.DashboardSummaryResponse;
import com.g02.padel.dashboard.usecase.GetDashboardSummaryUseCase;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {

    private final GetDashboardSummaryUseCase getDashboardSummary;

    public DashboardController(GetDashboardSummaryUseCase getDashboardSummary) {
        this.getDashboardSummary = getDashboardSummary;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse summary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return getDashboardSummary.execute(from, to);
    }
}
