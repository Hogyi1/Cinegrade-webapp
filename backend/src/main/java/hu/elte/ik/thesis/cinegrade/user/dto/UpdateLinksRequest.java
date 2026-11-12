package hu.elte.ik.thesis.cinegrade.user.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

// [AI-GENERATED] PUT /users/me/links replaces the whole list. Send [] to remove every link.
// Only http(s) so nobody can put a javascript: link on their profile.
public record UpdateLinksRequest(
        @NotNull(message = "Links are required")
        @Size(max = UpdateLinksRequest.MAX_LINKS, message = "You can add at most 5 links")
        List<
                @NotNull(message = "A link can't be empty")
                @Size(max = UpdateLinksRequest.MAX_LINK_LENGTH, message = "A link can be at most 200 characters")
                @Pattern(regexp = "^https?://[^\\s/$.?#][^\\s]*$", flags = Pattern.Flag.CASE_INSENSITIVE,
                        message = "Links must start with http:// or https://")
                String> links) {

    public static final int MAX_LINKS = 5;
    public static final int MAX_LINK_LENGTH = 200;
}
