package hu.elte.ik.thesis.cinegrade.user;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import hu.elte.ik.thesis.cinegrade.files.StoredFile;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import hu.elte.ik.thesis.cinegrade.user.dto.UpdateLinksRequest;
import hu.elte.ik.thesis.cinegrade.user.role.UserRole;

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
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
public class User implements UserDetails, Principal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private Long id;
    @Column(unique = true, nullable = false, updatable = false)
    private String email;
    @Column(unique = true, nullable = false)
    private String username;
    @Column(length = 750)
    private String description;
    private String password;
    private boolean accountLocked;
    private boolean enabled;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avatar_file_id")
    private StoredFile avatarFile;

    private LocalDateTime usernameChangedAt;

    // [AI-GENERATED] Profile links (website, Instagram, ...), in the order the user put them.
    // LAZY and open-in-view is off, so read them inside a transaction.
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "user_links", joinColumns = @JoinColumn(name = "user_id"))
    @OrderColumn(name = "position")
    @Column(name = "url", nullable = false, length = UpdateLinksRequest.MAX_LINK_LENGTH)
    @Builder.Default
    private List<String> links = new ArrayList<>();

    // A fetchType megmondja, hogy ezt a listát hogyan töltse be, tehát a user
    // Rolejait belerakja automatikusan, az EAGER mindig belerakja a Lazy viszont
    // csak akkor ha lekérdezik
    @ManyToOne(fetch = FetchType.EAGER)
    private UserRole userRole;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;
    @LastModifiedDate
    @Column(insertable = false)
    private LocalDateTime lastModifiedDate;

    private Integer totalDownloads;

    @Override
    public String getName() {
        return username;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(this.userRole.getName()));
    }

    @Override
    public boolean isAccountNonLocked() {
        return !accountLocked;
    }
}
