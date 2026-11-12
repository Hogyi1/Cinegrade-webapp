package hu.elte.ik.thesis.cinegrade.user.dto;

/** One row in the user search results. Built directly by UserRepository.searchByPrefix, so keep the field order. */
public record UserSummaryResponse(String username,
                                  Long avatarFileId,
                                  Long followerCount) {
}
