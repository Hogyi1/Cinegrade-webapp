package hu.elte.ik.thesis.cinegrade.user.follow;

// [AI-GENERATED] Long, not int: the sums in FollowRepository.findSummaryByUserId are Long,
// and Hibernate needs an exact constructor match.
public record FollowSummary(Long followingCount, Long followerCount) {
}
