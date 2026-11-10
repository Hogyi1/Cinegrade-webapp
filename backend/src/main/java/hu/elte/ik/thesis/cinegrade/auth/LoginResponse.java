package hu.elte.ik.thesis.cinegrade.auth;

import lombok.*;

public record LoginResponse(String jwt, String refreshToken) {
}
