package hu.elte.ik.thesis.cinegrade.files;

import hu.elte.ik.thesis.cinegrade.handler.BusinessErrorCodes;
import hu.elte.ik.thesis.cinegrade.handler.BusinessException;
import hu.elte.ik.thesis.cinegrade.user.User;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private static final long MAX_AVATAR_BYTES = 10 * 1024 * 1024;
    private static final int MAX_IMAGE_SIDE = 8000;
    // [AI-GENERATED] Same limit as the upload page checks before sending.
    private static final long MAX_POST_IMAGE_BYTES = 15 * 1024 * 1024;
    private static final int POST_IMAGE_SIDE = 2560;
    private static final Set<String> IMAGE_FORMATS = Set.of("jpeg", "png");
    private final StoredFileRepository files;
    private final ObjectMapper objectMapper;
    @Value("${application.files.upload-dir}")
    private Path uploadDir;

    @PostConstruct
    public void initialize() {
        ensureDirectory(uploadDir);
    }

    public FileDownload open(StoredFile file) {
        var resource = new FileSystemResource(uploadDir.resolve(file.getStorageKey().toString()));
        return new FileDownload(resource, file.getFileName(), file.getSizeInBytes());
    }

    public StoredFile findImage(Long id) {
        return files.findById(id)
                .filter(file -> file.getFileType() == FileType.IMAGE)
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.FILE_NOT_FOUND));
    }

    /** Deletes the row now, and the file only once the database change is really saved. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void delete(StoredFile file) {
        files.delete(file);
        Path path = uploadDir.resolve(file.getStorageKey().toString());
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException e) {
                    log.warn("Could not delete {}", path, e);
                }
            }
        });
    }

    public StoredFile storeAvatar(MultipartFile upload, User owner) throws IOException {
        if (upload.getSize() > MAX_AVATAR_BYTES) throw new BusinessException(BusinessErrorCodes.INVALID_FILE);
        byte[] original = upload.getBytes();
        checkImageHeader(original);
        byte[] avatar = toAvatar(original);

        UUID key = UUID.randomUUID();
        Files.write(uploadDir.resolve(key.toString()), avatar);

        StoredFile file = new StoredFile();
        file.setUser(owner);
        file.setFileType(FileType.IMAGE);
        file.setStorageKey(key);
        file.setFileName("avatar.jpg");
        file.setContentType("image/jpeg");
        file.setSizeInBytes((long) avatar.length);
        return files.save(file);
    }

    // [AI-GENERATED] A post's before or after photo. Scaled down to fit 2560 px and saved as JPEG,
    // which also drops the camera metadata (GPS and so on). Not cropped, unlike the avatar.
    public StoredFile storePostImage(MultipartFile upload, User owner, String fileName) throws IOException {
        if (upload.getSize() > MAX_POST_IMAGE_BYTES) throw new BusinessException(BusinessErrorCodes.INVALID_FILE);
        byte[] original = upload.getBytes();
        checkImageHeader(original);
        byte[] image = toPostImage(original);

        UUID key = UUID.randomUUID();
        Files.write(uploadDir.resolve(key.toString()), image);

        StoredFile file = new StoredFile();
        file.setUser(owner);
        file.setFileType(FileType.IMAGE);
        file.setStorageKey(key);
        file.setFileName(fileName);
        file.setContentType("image/jpeg");
        file.setSizeInBytes((long) image.length);
        return files.save(file);
    }

    // [AI-GENERATED] The post's LUT or cgedit for downloading; POST_HAS_NO_SUCH_FILE when the post has none.
    public StoredFile requireType(StoredFile file, FileType type) {
        if (file == null || file.getFileType() != type) throw new BusinessException(BusinessErrorCodes.POST_HAS_NO_SUCH_FILE);
        return file;
    }

    public StoredFile storeCgEdit(MultipartFile upload, User owner) throws IOException {
        validateCGEdit(upload);

        UUID key = UUID.randomUUID();
        atomicCopy(upload, uploadDir.resolve(key.toString()));

        StoredFile file = new StoredFile();
        file.setUser(owner);
        file.setFileType(FileType.CGEDIT);
        file.setStorageKey(key);
        file.setFileName("edit.cgedit");
        file.setContentType("application/json");
        file.setSizeInBytes(upload.getSize());
        return files.save(file);
    }

    public StoredFile storeLutFile(MultipartFile upload, User owner) throws IOException {
        validateLUT(upload);

        UUID key = UUID.randomUUID();
        atomicCopy(upload, uploadDir.resolve(key.toString()));

        StoredFile file = new StoredFile();
        file.setUser(owner);
        file.setFileType(FileType.LUT);
        file.setStorageKey(key);
        file.setFileName("cg.cube");
        file.setContentType("cube/lut");
        file.setSizeInBytes(upload.getSize());
        return files.save(file);
    }

    private void checkImageHeader(byte[] bytes) throws IOException {
        try (ImageInputStream in = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(in);
            if (!readers.hasNext()) throw new BusinessException(BusinessErrorCodes.INVALID_FILE);
            ImageReader reader = readers.next();
            try {
                reader.setInput(in, true, true);
                boolean allowed = IMAGE_FORMATS.contains(reader.getFormatName().toLowerCase(Locale.ROOT)) && reader.getWidth(0) <= MAX_IMAGE_SIDE && reader.getHeight(0) <= MAX_IMAGE_SIDE;
                if (!allowed) throw new BusinessException(BusinessErrorCodes.INVALID_FILE);
            } finally {
                reader.dispose();
            }
        } catch (IOException e) {
            throw new BusinessException(BusinessErrorCodes.INVALID_FILE);
        }
    }

    private byte[] toAvatar(byte[] original) throws IOException {
        try {
            // Reading from the stream, not a BufferedImage, keeps phone photos the right way up.
            BufferedImage resized = Thumbnails.of(new ByteArrayInputStream(original))
                    .size(500, 500)
                    .crop(Positions.CENTER)
                    .asBufferedImage();

            // JPEG has no transparency, so transparent areas become white instead of black.
            BufferedImage flat = new BufferedImage(500, 500, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = flat.createGraphics();
            g.drawImage(resized, 0, 0, Color.WHITE, null);
            g.dispose();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Thumbnails.of(flat)
                    .scale(1)
                    .outputFormat("jpg")
                    .outputQuality(0.75)
                    .toOutputStream(out);
            return out.toByteArray();
        } catch (IOException | RuntimeException e) {
            // Everything here happens in memory, so any failure means a bad image.
            throw new BusinessException(BusinessErrorCodes.INVALID_FILE);
        }
    }

    // [AI-GENERATED] Same steps as toAvatar, but keeps the whole picture and only shrinks big ones.
    private byte[] toPostImage(byte[] original) throws IOException {
        try {
            BufferedImage source = Thumbnails.of(new ByteArrayInputStream(original)).scale(1).asBufferedImage();
            int longest = Math.max(source.getWidth(), source.getHeight());
            double scale = longest > POST_IMAGE_SIDE ? (double) POST_IMAGE_SIDE / longest : 1;
            BufferedImage resized = Thumbnails.of(source).scale(scale).asBufferedImage();

            BufferedImage flat = new BufferedImage(resized.getWidth(), resized.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D g = flat.createGraphics();
            g.drawImage(resized, 0, 0, Color.WHITE, null);
            g.dispose();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Thumbnails.of(flat)
                    .scale(1)
                    .outputFormat("jpg")
                    .outputQuality(0.9)
                    .toOutputStream(out);
            return out.toByteArray();
        } catch (IOException | RuntimeException e) {
            throw new BusinessException(BusinessErrorCodes.INVALID_FILE);
        }
    }

    private void validateLUT(MultipartFile file) throws IOException {
        try (InputStream is = file.getInputStream()) {
            BufferedReader reader = new BufferedReader(new InputStreamReader(is));
            Set<String> validLines = Set.of("TITLE \"Cinegrade LUT\"");
            boolean isCgLut = reader.lines().anyMatch(validLines::contains);
            if (!isCgLut) {
                throw new BusinessException(BusinessErrorCodes.INVALID_FILE);
            }
        } catch (IOException ex) {
            throw new BusinessException(BusinessErrorCodes.INVALID_FILE);
        }
    }

    private void validateCGEdit(MultipartFile file) {
        try (InputStream is = file.getInputStream()) {
            JsonNode jsonNode = objectMapper.readTree(is);
            if (jsonNode.has("formatVersion") && jsonNode.has("editState")) {
                int version = jsonNode.get("formatVersion").asInt();
                if (version < 0) {
                    throw new BusinessException(BusinessErrorCodes.INVALID_FILE);
                }
            } else {
                throw new BusinessException(BusinessErrorCodes.INVALID_FILE);
            }
        } catch (IOException | JacksonException ex) {
            throw new BusinessException(BusinessErrorCodes.INVALID_FILE);
        }
    }

    /**
     * Performs an atomic copy operation.
     *
     * @param source the source destination
     * @param target the target destination
     */
    private void atomicCopy(MultipartFile source, Path target) {
        try {
            ensureDirectory(target.getParent());

            Path tempTarget = target.resolveSibling(target.getFileName() + "." + UUID.randomUUID() + ".tmp");
            source.transferTo(tempTarget);

            try {
                Files.move(tempTarget, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(tempTarget, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to copy file", ex);
        }
    }

    /**
     * Ensures that the specified directory exists.
     *
     * @param dir the directory to ensure
     */
    private void ensureDirectory(Path dir) {
        if (!Files.exists(dir)) {
            try {
                Files.createDirectories(dir);
            } catch (Exception e) {
                throw new IllegalArgumentException("Failed to create directory", e);
            }
        }
    }
}