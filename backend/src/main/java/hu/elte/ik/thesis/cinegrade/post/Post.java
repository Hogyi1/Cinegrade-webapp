package hu.elte.ik.thesis.cinegrade.post;

import hu.elte.ik.thesis.cinegrade.files.StoredFile;
import hu.elte.ik.thesis.cinegrade.user.User;
import jakarta.persistence.*;
import lombok.*;
import hu.elte.ik.thesis.cinegrade.tag.Tag;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Check;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "posts", indexes = {
        @Index(name = "idx_posts_userId", columnList = "user_id"),
        @Index(name = "idx_posts_created_at", columnList = "created_at")
})
@Check(constraints = "cgedit_file_id IS NOT NULL OR lut_file_id IS NOT NULL")
@EntityListeners(AuditingEntityListener.class)
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 2000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "before_file_id", nullable = false)
    private StoredFile beforeFile;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "after_file_id", nullable = false)
    private StoredFile afterFile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cgedit_file_id")
    private StoredFile cgeditFile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lut_file_id")
    private StoredFile lutFile;

    // [AI-GENERATED] The LUT's target colour space. Only Rec709 for now.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ColorSpace colorSpace = ColorSpace.REC709;

    // [AI-GENERATED] Up to 5 of the seeded tags. BatchSize loads the tags of a whole page in one query.
    @ManyToMany
    @JoinTable(name = "post_tags",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @BatchSize(size = 50)
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    // [AI-GENERATED] Null when not pinned. A user has at most one pinned post.
    private LocalDateTime pinnedAt;

    // [AI-GENERATED] Kept in step by PostRepository.incrementLikes/decrementLikes, so sorting by popular is cheap.
    @Column(nullable = false)
    private long likeCount;

    @Column(nullable = false)
    private long downloadCount;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(insertable = false)
    private LocalDateTime updatedAt;
}
