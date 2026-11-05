package com.g02.padel.court.usecase;

import com.g02.padel.court.Court;
import com.g02.padel.shared.enums.CourtType;

final class CourtFixtures {

    private CourtFixtures() {
    }

    static Court court(Long id, String name, CourtType type, boolean indoor, boolean active) {
        var court = new Court();
        court.setId(id);
        court.setName(name);
        court.setType(type);
        court.setIndoor(indoor);
        court.setActive(active);
        return court;
    }
}
