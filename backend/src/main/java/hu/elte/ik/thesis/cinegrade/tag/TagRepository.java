package hu.elte.ik.thesis.cinegrade.tag;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

// [AI-GENERATED]
public interface TagRepository extends JpaRepository<Tag, Integer> {

    /** Fewer results than slugs means some slug doesn't exist (UNKNOWN_TAG). */
    List<Tag> findBySlugIn(Collection<String> slugs);

    boolean existsBySlug(String slug);
}
