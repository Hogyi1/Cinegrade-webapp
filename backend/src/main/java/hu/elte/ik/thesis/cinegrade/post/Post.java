package hu.elte.ik.thesis.cinegrade.post;

import hu.elte.ik.thesis.cinegrade.files.StoredFile;
import hu.elte.ik.thesis.cinegrade.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.DialectOverride;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDateTime;

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
    @JoinColumn(name = "preview_file_id", nullable = false)
    private StoredFile previewFile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cgedit_file_id")
    private StoredFile cgeditFile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lut_file_id")
    private StoredFile lutFile;

    private boolean commentsEnabled;
    private int downloadCount;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(insertable = false)
    private LocalDateTime updatedAt;
}
