package hu.elte.ik.thesis.cinegrade.post.like;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Set;

// [AI-GENERATED] Fixed: findByPostId used :id while the parameter was postId (fails at startup),
// and the user ids were Integer while User.id is Long.
public interface LikeRepository extends JpaRepository<Like, Integer> {

    @Query("select l from Like l where l.post.id = :postId")
    List<Like> findByPostId(@Param("postId") Integer postId);

    boolean existsByPostIdAndUserId(Integer postId, Long userId);

    Integer countByPostId(Integer postId);

    /** Returns how many rows went, so the service only lowers likeCount when a like really existed. */
    @Modifying
    @Query("delete from Like l where l.post.id = :postId and l.user.id = :userId")
    int deleteByPostIdAndUserId(@Param("postId") Integer postId, @Param("userId") Long userId);

    /** Before deleting a post. */
    @Modifying
    @Query("delete from Like l where l.post.id = :postId")
    void deleteAllByPostId(@Param("postId") Integer postId);

    /** Which of these posts the user liked: one query per page instead of one per post. */
    @Query("select l.post.id from Like l where l.user.id = :userId and l.post.id in :postIds")
    Set<Integer> findLikedPostIds(@Param("userId") Long userId, @Param("postIds") Collection<Integer> postIds);
}
