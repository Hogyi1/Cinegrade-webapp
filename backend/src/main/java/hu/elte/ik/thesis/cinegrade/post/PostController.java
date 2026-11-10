package hu.elte.ik.thesis.cinegrade.post;

import hu.elte.ik.thesis.cinegrade.files.FileDownload;
import hu.elte.ik.thesis.cinegrade.files.FileType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@Getter
@Setter
@RequiredArgsConstructor
@RestController
public class PostController {

    private final PostService postService;

    @GetMapping("/{id}/download/{kind:lut|cgedit}")
    public ResponseEntity<Resource> download(@PathVariable Integer id, @PathVariable String kind) {
        FileDownload d = postService.download(id, kind.equals("lut") ? FileType.LUT : FileType.CGEDIT);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(d.sizeInBytes())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(d.fileName(), StandardCharsets.UTF_8).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(d.resource());
    }
}
