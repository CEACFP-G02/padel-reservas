package com.g02.padel.dashboard;

import com.g02.padel.dashboard.dto.DashboardSummaryResponse;
import com.g02.padel.dashboard.usecase.GetDashboardSummaryUseCase;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@PreAuthorize("hasRole('OWNER')")
public class DashboardController {

    private final GetDashboardSummaryUseCase getDashboardSummary;

    public DashboardController(GetDashboardSummaryUseCase getDashboardSummary) {
        this.getDashboardSummary = getDashboardSummary;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse summary() {
        return getDashboardSummary.execute();
    }
}
