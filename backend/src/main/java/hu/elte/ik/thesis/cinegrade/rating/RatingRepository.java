package hu.elte.ik.thesis.cinegrade.rating;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {

    // The vote this rater already gave this user, if any (to update it instead of adding a second one)
    Optional<Rating> findByRaterIdAndRatedId(Long raterId, Long ratedId);

    boolean existsByRaterIdAndRatedId(Long raterId, Long ratedId);

    // Average and number of votes in one query
    @Query("select new hu.elte.ik.thesis.cinegrade.rating.RatingSummary(avg(r.stars), count(r)) "
            + "from Rating r where r.rated.id = :ratedId")
    RatingSummary findSummaryByRatedId(@Param("ratedId") Long ratedId);

    void deleteByRaterIdAndRatedId(Long raterId, Long ratedId);
}
