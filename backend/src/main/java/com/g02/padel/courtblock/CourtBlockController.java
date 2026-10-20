package com.g02.padel.courtblock;

import com.g02.padel.courtblock.dto.CourtBlockRequest;
import com.g02.padel.courtblock.dto.CourtBlockResponse;
import com.g02.padel.courtblock.usecase.CreateBlockUseCase;
import com.g02.padel.courtblock.usecase.ListBlocksUseCase;
import com.g02.padel.courtblock.usecase.RemoveBlockUseCase;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasRole('ADMIN')")
public class CourtBlockController {

    private final ListBlocksUseCase listBlocks;
    private final CreateBlockUseCase createBlock;
    private final RemoveBlockUseCase removeBlock;

    public CourtBlockController(ListBlocksUseCase listBlocks, CreateBlockUseCase createBlock,
                                RemoveBlockUseCase removeBlock) {
        this.listBlocks = listBlocks;
        this.createBlock = createBlock;
        this.removeBlock = removeBlock;
    }

    @GetMapping("/courts/{courtId}/blocks")
    public List<CourtBlockResponse> list(
            @PathVariable Long courtId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return listBlocks.execute(courtId, date);
    }

    @PostMapping("/courts/{courtId}/blocks")
    @ResponseStatus(HttpStatus.CREATED)
    public CourtBlockResponse create(@PathVariable Long courtId, @Valid @RequestBody CourtBlockRequest request) {
        return createBlock.execute(courtId, request);
    }

    @DeleteMapping("/courts/{courtId}/blocks/{blockId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable Long courtId, @PathVariable Long blockId) {
        removeBlock.execute(courtId, blockId);
    }
}
