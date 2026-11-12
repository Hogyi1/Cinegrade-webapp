package hu.elte.ik.thesis.cinegrade.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RateUserRequest(@NotNull @Min(1) @Max(5) Short stars) {
}
