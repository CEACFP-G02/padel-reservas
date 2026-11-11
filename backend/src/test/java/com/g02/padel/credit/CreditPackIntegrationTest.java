package com.g02.padel.credit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** The migration seeds the four packs; list and price update go through the real use cases and database. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(username = "owner@padel.test", roles = "OWNER")
class CreditPackIntegrationTest {

    @Autowired
    private MockMvc mvc;
    @Autowired
    private CreditPackRepository packs;

    @Test
    void theMigrationSeedsTheFourPacksWithACheaperPricePerReservationAsTheyGrow() {
        List<CreditPack> seeded = packs.findAllByOrderBySizeAsc();

        assertThat(seeded).extracting(CreditPack::getSize).containsExactly(5, 10, 15, 20);
        assertThat(seeded).extracting(CreditPack::getPrice).allSatisfy(price -> {
            assertThat(price).isGreaterThanOrEqualTo(BigDecimal.ZERO);
            assertThat(price.scale()).isEqualTo(2);
        });
        List<BigDecimal> perReservation = seeded.stream()
                .map(pack -> pack.getPrice().divide(BigDecimal.valueOf(pack.getSize()), 4, RoundingMode.HALF_UP))
                .toList();
        for (int i = 1; i < perReservation.size(); i++) {
            assertThat(perReservation.get(i)).isLessThan(perReservation.get(i - 1));
        }
    }

    @Test
    void listsTheSeededPacks() throws Exception {
        mvc.perform(get("/api/v1/credit-packs"))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                        [ { "size": 5, "price": 75.00 }, { "size": 10, "price": 140.00 },
                          { "size": 15, "price": 195.00 }, { "size": 20, "price": 240.00 } ]
                        """));
    }

    @Test
    void updatesAPriceAndKeepsTheFourSizes() throws Exception {
        CreditPack ten = packs.findAllByOrderBySizeAsc().get(1);

        mvc.perform(patch("/api/v1/credit-packs/" + ten.getId()).contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"price\": 130.5, \"size\": 7 }"))
                .andExpect(status().isOk())
                .andExpect(content().json("{ \"id\": " + ten.getId() + ", \"size\": 10, \"price\": 130.50 }", true));

        assertThat(packs.findById(ten.getId())).get()
                .satisfies(pack -> assertThat(pack.getPrice()).isEqualByComparingTo("130.50"));
        assertThat(packs.findAllByOrderBySizeAsc()).extracting(CreditPack::getSize).containsExactly(5, 10, 15, 20);
    }
}
