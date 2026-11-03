package com.g02.padel.shared.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.boot.test.json.JacksonTester;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Paginated lists serialize as docs/api.md#conventions: content + page, size, totalElements, totalPages. */
@JsonTest
class PageResponseJsonTest {

    @Autowired
    private JacksonTester<PageResponse<String>> json;

    @Test
    void wrapsSpringDataPageInTheContractShape() throws Exception {
        var page = new PageImpl<>(List.of("a", "b"), PageRequest.of(1, 20), 41);

        assertThat(json.write(PageResponse.of(page))).isStrictlyEqualToJson("""
                { "content": ["a", "b"], "page": 1, "size": 20, "totalElements": 41, "totalPages": 3 }
                """);
    }
}
