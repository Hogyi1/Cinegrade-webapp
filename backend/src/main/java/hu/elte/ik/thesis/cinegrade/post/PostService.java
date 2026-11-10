package hu.elte.ik.thesis.cinegrade.post;

import hu.elte.ik.thesis.cinegrade.files.FileDownload;
import hu.elte.ik.thesis.cinegrade.files.FileType;
import hu.elte.ik.thesis.cinegrade.files.StoredFile;
import hu.elte.ik.thesis.cinegrade.files.StoredFileRepository;
import hu.elte.ik.thesis.cinegrade.likes.LikeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final StoredFileRepository storedFileRepository;
    private final LikeRepository likeRepository;

    public void createPost(PostRequest request) {
        // Implementation for creating a post
    }

    public Post getPost(Integer id) {
        return postRepository.findById(id).orElse(null);
    }

    public void updatePost(Integer id, PostRequest request) {
        // Implementation for updating a post
    }

    public void deletePost(Integer id) {
        // Implementation for deleting a post
    }

    public void likePost(Integer id) {
        // Implementation for liking a post
    }

    @Transactional
    public FileDownload download(Integer id, FileType lut) {
        return null;
    }
}
