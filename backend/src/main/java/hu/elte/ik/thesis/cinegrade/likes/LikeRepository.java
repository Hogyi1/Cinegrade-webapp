package hu.elte.ik.thesis.cinegrade.likes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Integer> {
    @Query("select l from Like l where l.post.id = :id")
    Optional<List<Like>> findByPostId(Integer postId);

    boolean existsByPostIdAndUserId(Integer postId, Integer userId);
    Integer countByPostId(Integer postId);
}
