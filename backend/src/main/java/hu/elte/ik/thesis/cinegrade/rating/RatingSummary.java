package hu.elte.ik.thesis.cinegrade.rating;

// average is null when nobody has rated the user yet
public record RatingSummary(Double average, Long count) {
}
