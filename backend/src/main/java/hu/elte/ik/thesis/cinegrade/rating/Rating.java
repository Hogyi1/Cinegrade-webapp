package hu.elte.ik.thesis.cinegrade.rating;

import java.time.LocalDateTime;

import org.hibernate.annotations.Check;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import hu.elte.ik.thesis.cinegrade.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "ratings",
        // One vote per person: changing your mind updates the row instead of adding a new one
        uniqueConstraints = @UniqueConstraint(name = "uk_ratings_rater_rated", columnNames = {"rater_id", "rated_id"}),
        // The unique constraint already covers lookups by rater; this one is for averaging by rated user
        indexes = @Index(name = "idx_ratings_rated_id", columnList = "rated_id"))
@Check(constraints = "stars BETWEEN 1 AND 5 AND rater_id <> rated_id")
@EntityListeners(AuditingEntityListener.class)
public class Rating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Who gave the rating
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rater_id", nullable = false)
    private User rater;

    // Who got the rating
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rated_id", nullable = false)
    private User rated;

    @Column(nullable = false)
    private short stars;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(insertable = false)
    private LocalDateTime updatedAt;
}
