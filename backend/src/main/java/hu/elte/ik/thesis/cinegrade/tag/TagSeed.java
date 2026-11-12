package hu.elte.ik.thesis.cinegrade.tag;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

import static hu.elte.ik.thesis.cinegrade.tag.TagGroup.*;

// [AI-GENERATED] Inserts the tags that are missing, so adding one here and restarting is enough.
// Never rename a slug: posts and shared /search links refer to it.
@Component
@RequiredArgsConstructor
public class TagSeed implements CommandLineRunner {

    private final TagRepository tags;

    @Override
    public void run(String... args) {
        TAGS.forEach((slug, entry) -> {
            if (!tags.existsBySlug(slug)) {
                tags.save(Tag.builder().slug(slug).name(entry.name()).tagGroup(entry.group()).build());
            }
        });
    }

    private record Entry(String name, TagGroup group) {}

    private static final Map<String, Entry> TAGS = new LinkedHashMap<>();

    private static void add(TagGroup group, String slug, String name) {
        TAGS.put(slug, new Entry(name, group));
    }

    static {
        add(LOOK, "cinematic", "Cinematic");
        add(LOOK, "film-emulation", "Film emulation");
        add(LOOK, "teal-orange", "Teal & orange");
        add(LOOK, "bleach-bypass", "Bleach bypass");
        add(LOOK, "vintage", "Vintage");
        add(LOOK, "retro-70s", "Retro 70s");
        add(LOOK, "noir", "Noir");
        add(LOOK, "black-white", "Black & white");
        add(LOOK, "moody", "Moody");
        add(LOOK, "pastel", "Pastel");
        add(LOOK, "matte", "Matte");
        add(LOOK, "faded", "Faded");
        add(LOOK, "high-contrast", "High contrast");
        add(LOOK, "low-contrast", "Low contrast");
        add(LOOK, "desaturated", "Desaturated");
        add(LOOK, "vibrant", "Vibrant");
        add(LOOK, "cross-process", "Cross process");
        add(LOOK, "cyberpunk", "Cyberpunk");
        add(LOOK, "neon", "Neon");
        add(LOOK, "dreamy", "Dreamy");
        add(LOOK, "grunge", "Grunge");

        add(TONE, "warm", "Warm");
        add(TONE, "cool", "Cool");
        add(TONE, "golden-hour", "Golden hour");
        add(TONE, "blue-hour", "Blue hour");
        add(TONE, "natural", "Natural");
        add(TONE, "clean", "Clean");
        add(TONE, "day-for-night", "Day for night");

        add(SUBJECT, "portrait", "Portrait");
        add(SUBJECT, "skin-tones", "Skin tones");
        add(SUBJECT, "landscape", "Landscape");
        add(SUBJECT, "nature", "Nature");
        add(SUBJECT, "street", "Street");
        add(SUBJECT, "architecture", "Architecture");
        add(SUBJECT, "night", "Night");
        add(SUBJECT, "wedding", "Wedding");
        add(SUBJECT, "fashion", "Fashion");
        add(SUBJECT, "travel", "Travel");
        add(SUBJECT, "food", "Food");
        add(SUBJECT, "product", "Product");
        add(SUBJECT, "automotive", "Automotive");
        add(SUBJECT, "sports", "Sports");
        add(SUBJECT, "documentary", "Documentary");
        add(SUBJECT, "music-video", "Music video");
        add(SUBJECT, "commercial", "Commercial");
        add(SUBJECT, "horror", "Horror");
        add(SUBJECT, "sci-fi", "Sci-fi");
        add(SUBJECT, "western", "Western");
        add(SUBJECT, "aerial", "Aerial");
        add(SUBJECT, "underwater", "Underwater");

        add(TECHNICAL, "log-to-rec709", "Log to Rec709");
        add(TECHNICAL, "overcast-fix", "Overcast fix");
        add(TECHNICAL, "indoor", "Indoor");
        add(TECHNICAL, "snow", "Snow");
    }
}
