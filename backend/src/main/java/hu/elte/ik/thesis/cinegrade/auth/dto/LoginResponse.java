package hu.elte.ik.thesis.cinegrade.auth.dto;

import lombok.*;

public record LoginResponse(String jwt, String refreshToken) {
}
