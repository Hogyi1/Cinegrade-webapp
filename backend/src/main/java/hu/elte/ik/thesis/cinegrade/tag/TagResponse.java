package hu.elte.ik.thesis.cinegrade.tag;

// [AI-GENERATED]
public record TagResponse(String slug, String name, TagGroup group) {

    public static TagResponse of(Tag tag) {
        return new TagResponse(tag.getSlug(), tag.getName(), tag.getTagGroup());
    }
}
