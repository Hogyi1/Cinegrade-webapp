package hu.elte.ik.thesis.cinegrade.post;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

// [AI-GENERATED] Every list query loads the author and their avatar with the post (no N+1);
// the tags come in one extra query per page thanks to @BatchSize on Post.tags.
public interface PostRepository extends JpaRepository<Post, Integer> {

    /** "popular" -> most liked first, anything else -> newest first. For the feed and search. */
    static Sort sortOf(String sort) {
        return "popular".equalsIgnoreCase(sort)
                ? Sort.by(Sort.Order.desc("likeCount"), Sort.Order.desc("createdAt"))
                : Sort.by(Sort.Order.desc("createdAt"));
    }

    /** The detail page and downloads: everything the post points at in one query. */
    @EntityGraph(attributePaths = {"user", "user.avatarFile", "beforeFile", "afterFile", "lutFile", "cgeditFile"})
    Optional<Post> findWithFilesById(Integer id);

    /** Everyone's posts ("For you"). Sort with sortOf. */
    @EntityGraph(attributePaths = {"user", "user.avatarFile"})
    @Query("select p from Post p where p.user.enabled = true and p.user.accountLocked = false")
    Page<Post> findFeed(Pageable pageable);

    /** Posts by the people the viewer follows ("Following"). Sort with sortOf. */
    @EntityGraph(attributePaths = {"user", "user.avatarFile"})
    @Query("""
            select p from Post p
            where p.user.id in (select f.followed.id from Follow f where f.follower.id = :viewerId)
              and p.user.enabled = true and p.user.accountLocked = false""")
    Page<Post> findFollowingFeed(@Param("viewerId") Long viewerId, Pageable pageable);

    /** One user's profile grid: the pinned post first, then newest. Pass an unsorted Pageable. */
    @EntityGraph(attributePaths = {"user", "user.avatarFile"})
    @Query(value = """
            select p from Post p where p.user.username = :username
            order by case when p.pinnedAt is null then 1 else 0 end, p.createdAt desc""",
            countQuery = "select count(p) from Post p where p.user.username = :username")
    Page<Post> findByAuthor(@Param("username") String username, Pageable pageable);

    /** Use search(...) below; it turns null or blank arguments into what this query expects. */
    @EntityGraph(attributePaths = {"user", "user.avatarFile"})
    @Query("""
            select p from Post p
            where p.user.enabled = true and p.user.accountLocked = false
              and (:pattern = '' or lower(p.title) like :pattern escape '\\')
              and (:tagCount = 0 or p.id in (
                    select p2.id from Post p2 join p2.tags t
                    where t.slug in :tags
                    group by p2.id
                    having count(distinct t.id) = :tagCount))""")
    Page<Post> searchRaw(@Param("pattern") String pattern,
                         @Param("tags") List<String> tags,
                         @Param("tagCount") long tagCount,
                         Pageable pageable);

    /**
     * Title contains q (case-insensitive) and the post has every one of the tags.
     * q and tags may be null or empty. Sort with sortOf.
     */
    default Page<Post> search(String q, List<String> tags, Pageable pageable) {
        String pattern = q == null || q.isBlank() ? ""
                : "%" + q.trim().toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
        List<String> distinct = tags == null ? List.of() : tags.stream().distinct().toList();
        // An empty IN () isn't valid SQL, so pass a slug no tag has; tagCount = 0 skips that check anyway.
        return searchRaw(pattern, distinct.isEmpty() ? List.of("") : distinct, distinct.size(), pageable);
    }

    Page<Post> findByUserId(Long userId, Pageable pageable);

    long countByUserId(Long userId);

    @Modifying
    @Query("update Post p set p.likeCount = p.likeCount + 1 where p.id = :id")
    void incrementLikes(@Param("id") Integer id);

    @Modifying
    @Query("update Post p set p.likeCount = p.likeCount - 1 where p.id = :id and p.likeCount > 0")
    void decrementLikes(@Param("id") Integer id);

    @Modifying
    @Query("update Post p set p.downloadCount = p.downloadCount + 1 where p.id = :id")
    void incrementDownloads(@Param("id") Integer id);

    /** Call before pinning, so a user only ever has one pinned post. */
    @Modifying
    @Query("update Post p set p.pinnedAt = null where p.user.id = :userId and p.pinnedAt is not null")
    void unpinAllFor(@Param("userId") Long userId);
}
