package hu.elte.ik.thesis.cinegrade.user.dto;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

/** The logged-in user's own profile. nextUsernameChangeAt is null when the username can be changed right now. */
@Builder
public record UserProfileResponse(
        String username,
        String email,
        String description,
        Long avatarFileId,
        Double averageRating,  // null when nobody has rated yet
        Long ratingCount,
        // [AI-GENERATED] Long to match FollowSummary and count queries
        Long followerCount,
        Long followingCount,
        Long postCount,
        LocalDateTime nextUsernameChangeAt,
        // [AI-GENERATED] Same list the public profile shows
        List<String> links) {
}
