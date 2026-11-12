package hu.elte.ik.thesis.cinegrade.post.save;

import hu.elte.ik.thesis.cinegrade.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Set;

// [AI-GENERATED]
public interface SavedPostRepository extends JpaRepository<SavedPost, Integer> {

    boolean existsByPostIdAndUserId(Integer postId, Long userId);

    @Modifying
    @Query("delete from SavedPost s where s.post.id = :postId and s.user.id = :userId")
    int deleteByPostIdAndUserId(@Param("postId") Integer postId, @Param("userId") Long userId);

    @Modifying
    @Query("delete from SavedPost s where s.post.id = :postId")
    void deleteAllByPostId(@Param("postId") Integer postId);

    @Query("select s.post.id from SavedPost s where s.user.id = :userId and s.post.id in :postIds")
    Set<Integer> findSavedPostIds(@Param("userId") Long userId, @Param("postIds") Collection<Integer> postIds);

    /** GET /users/me/saved, newest save first. Pass an unsorted Pageable. */
    @Query(value = """
            select p from SavedPost s join s.post p join fetch p.user u left join fetch u.avatarFile
            where s.user.id = :userId
            order by s.createdAt desc""",
            countQuery = "select count(s) from SavedPost s where s.user.id = :userId")
    Page<Post> findSavedPosts(@Param("userId") Long userId, Pageable pageable);
}
