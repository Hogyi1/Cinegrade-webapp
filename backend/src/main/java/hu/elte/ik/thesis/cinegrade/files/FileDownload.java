package hu.elte.ik.thesis.cinegrade.files;


import org.springframework.core.io.Resource;

public record FileDownload(Resource resource, String fileName, long sizeInBytes) {
}
