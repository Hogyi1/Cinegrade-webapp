package hu.elte.ik.thesis.cinegrade.files;

import java.time.Duration;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("files")
@RequiredArgsConstructor
@Tag(name = "Files")
public class FileController {

    private final FileStorageService storage;

    // Public, so an <img> can load it. LUT and CGEDIT files are never served from here.
    @GetMapping("/{id}")
    public ResponseEntity<Resource> image(@PathVariable Long id) {
        StoredFile file = storage.findImage(id);
        FileDownload download = storage.open(file);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .contentLength(download.sizeInBytes())
                // A new picture always gets a new id, so a stored one never changes.
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic())
                .header("X-Content-Type-Options", "nosniff")
                .body(download.resource());
    }
}
