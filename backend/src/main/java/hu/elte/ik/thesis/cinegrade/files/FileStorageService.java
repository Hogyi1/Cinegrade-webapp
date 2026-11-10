package hu.elte.ik.thesis.cinegrade.files;

import hu.elte.ik.thesis.cinegrade.user.User;
import jakarta.annotation.Resource;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {
    private final StoredFileRepository files;

    @Value("${application.files.upload-dir}")
    private Path uploadDir;

    // TODO move to
    public StoredFile store(MultipartFile upload, FileType type, User owner) throws IOException {
        // validate the content here first, as PLAN.md describes
        UUID key = UUID.randomUUID();
        Files.createDirectories(uploadDir);
        upload.transferTo(uploadDir.resolve(key.toString()));

        StoredFile file = new StoredFile();
        file.setUser(owner);
        file.setFileType(type);
        file.setStorageKey(key);
        file.setFileName(upload.getOriginalFilename());
        file.setSizeInBytes(upload.getSize());
        return files.save(file);
    }

    public FileDownload open(StoredFile file) {
        var resource = new FileSystemResource(uploadDir.resolve(file.getStorageKey().toString()));
        return new FileDownload(resource, file.getFileName(), file.getSizeInBytes());
    }
}