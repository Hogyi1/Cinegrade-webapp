package hu.elte.ik.thesis.cinegrade.user.follow;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FollowRepository extends JpaRepository<Follow, Integer>{
    // [AI-GENERATED] Everyone this user follows (the parameter was named followedId by mistake)
    @Query("select f from Follow f where f.follower.id = :followerId")
    List<Follow> findByFollowerId(@Param("followerId") Long followerId);

    boolean existsByFollowedIdAndFollowerId(Long followedId, Long followerId);

    void deleteByFollowerIdAndFollowedId(Long followerId, Long followedId);

    @Query("""
      select new hu.elte.ik.thesis.cinegrade.user.follow.FollowSummary(
          coalesce(sum(case when f.follower.id = :userId then 1L else 0L end), 0L),
          coalesce(sum(case when f.followed.id = :userId then 1L else 0L end), 0L))
      from Follow f
      where f.follower.id = :userId or f.followed.id = :userId
      """)
    FollowSummary findSummaryByUserId(@Param("userId") Long userId);
}
