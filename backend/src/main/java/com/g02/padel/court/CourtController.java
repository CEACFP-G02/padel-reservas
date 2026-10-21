package com.g02.padel.court;

import com.g02.padel.court.dto.CourtRequest;
import com.g02.padel.court.dto.CourtResponse;
import com.g02.padel.court.usecase.CreateCourtUseCase;
import com.g02.padel.court.usecase.DeactivateCourtUseCase;
import com.g02.padel.court.usecase.GetCourtUseCase;
import com.g02.padel.court.usecase.ListCourtsUseCase;
import com.g02.padel.court.usecase.UpdateCourtUseCase;
import com.g02.padel.shared.enums.CourtType;
import com.g02.padel.shared.web.PageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/courts")
public class CourtController {

    private final ListCourtsUseCase listCourts;
    private final GetCourtUseCase getCourt;
    private final CreateCourtUseCase createCourt;
    private final UpdateCourtUseCase updateCourt;
    private final DeactivateCourtUseCase deactivateCourt;

    public CourtController(ListCourtsUseCase listCourts, GetCourtUseCase getCourt, CreateCourtUseCase createCourt,
                           UpdateCourtUseCase updateCourt, DeactivateCourtUseCase deactivateCourt) {
        this.listCourts = listCourts;
        this.getCourt = getCourt;
        this.createCourt = createCourt;
        this.updateCourt = updateCourt;
        this.deactivateCourt = deactivateCourt;
    }

    @GetMapping
    public PageResponse<CourtResponse> list(@RequestParam(required = false) CourtType type,
                                            @RequestParam(required = false) Boolean active,
                                            @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.of(listCourts.execute(type, active, pageable));
    }

    @GetMapping("/{id}")
    public CourtResponse get(@PathVariable Long id) {
        return getCourt.execute(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('OWNER')")
    public CourtResponse create(@Valid @RequestBody CourtRequest request) {
        return createCourt.execute(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public CourtResponse update(@PathVariable Long id, @Valid @RequestBody CourtRequest request) {
        return updateCourt.execute(id, request);
    }

    @PatchMapping("/{id}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('OWNER')")
    public void deactivate(@PathVariable Long id) {
        deactivateCourt.execute(id);
    }
}
