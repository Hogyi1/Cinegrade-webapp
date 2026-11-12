package hu.elte.ik.thesis.cinegrade.user.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record PublicUserProfileResponse(String username,
                                        String description,
                                        Long avatarFileId,
                                        Double averageRating,// kept in the API, not shown on the site
                                        Long ratingCount,
                                        Short myRating,
                                        // [AI-GENERATED] Long to match FollowSummary and count queries
                                        Long followerCount,
                                        Long followingCount,
                                        Long postCount,// 0 until posts exist
                                        Boolean following,// null when logged out
                                        List<String> links) {}  // List.of() until links exist
