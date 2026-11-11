package com.g02.padel.user.dto;

/** A client as the owner manages it (docs/api.md#users--clients--apiv1users). */
public record ClientResponse(
        Long id,
        String name,
        String email,
        String phone,
        boolean active
) {
}
