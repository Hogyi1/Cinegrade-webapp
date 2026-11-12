package hu.elte.ik.thesis.cinegrade.tag;

import jakarta.persistence.*;
import lombok.*;

// [AI-GENERATED] A fixed grade type ("teal-orange", "portrait"). Users pick from these and can't
// create new ones; TagSeed fills the table on startup.
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tags")
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // What the API and URLs use: /search?tags=teal-orange
    @Column(nullable = false, unique = true, length = 40)
    private String slug;

    @Column(nullable = false, length = 60)
    private String name;

    // Not "group": that's a reserved word in SQL and HQL. TagResponse still calls it "group" in the JSON.
    @Enumerated(EnumType.STRING)
    @Column(name = "tag_group", nullable = false, length = 20)
    private TagGroup tagGroup;
}
