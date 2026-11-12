package hu.elte.ik.thesis.cinegrade.post;

import hu.elte.ik.thesis.cinegrade.files.FileDownload;
import hu.elte.ik.thesis.cinegrade.files.FileStorageService;
import hu.elte.ik.thesis.cinegrade.files.FileType;
import hu.elte.ik.thesis.cinegrade.files.StoredFile;
import hu.elte.ik.thesis.cinegrade.handler.BusinessErrorCodes;
import hu.elte.ik.thesis.cinegrade.handler.BusinessException;
import hu.elte.ik.thesis.cinegrade.post.dto.CreatePostRequest;
import hu.elte.ik.thesis.cinegrade.post.dto.PostDetailResponse;
import hu.elte.ik.thesis.cinegrade.post.dto.PostSummaryResponse;
import hu.elte.ik.thesis.cinegrade.post.dto.UpdatePostRequest;
import hu.elte.ik.thesis.cinegrade.post.like.Like;
import hu.elte.ik.thesis.cinegrade.post.like.LikeRepository;
import hu.elte.ik.thesis.cinegrade.post.save.SavedPost;
import hu.elte.ik.thesis.cinegrade.post.save.SavedPostRepository;
import hu.elte.ik.thesis.cinegrade.tag.Tag;
import hu.elte.ik.thesis.cinegrade.tag.TagRepository;
import hu.elte.ik.thesis.cinegrade.user.User;
import hu.elte.ik.thesis.cinegrade.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PagedModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

// [AI-GENERATED] Stubs: the signatures and what each method should do. The bodies are yours.
// Everything that builds a response needs @Transactional (readOnly for reads): Post.tags is lazy
// and open-in-view is off. viewer is null when nobody is logged in.
@Service
@RequiredArgsConstructor
public class PostService {

    /**
     * Largest page the API hands out, whatever size the client asks for.
     */
    public static final int MAX_PAGE_SIZE = 50;

    private final PostRepository postRepository;
    private final LikeRepository likeRepository;
    private final SavedPostRepository savedPostRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final PostMapper postMapper;

    private static boolean has(MultipartFile f) {
        return f != null && !f.isEmpty();
    }

    @Transactional
    public PostDetailResponse create(User author, CreatePostRequest request) {
        if (!has(request.getLut()) && !has(request.getCgedit())) {
            throw new BusinessException(BusinessErrorCodes.POST_FILE_REQUIRED);
        }
        if (!has(request.getBefore()) || !has(request.getAfter())) {
            throw new BusinessException(BusinessErrorCodes.INVALID_FILE);
        }
        var tags = resolveTags(request.getTags());
        try {
            StoredFile lutFile = has(request.getLut()) ? fileStorageService.storeLutFile(request.getLut(), author) : null;
            StoredFile cgeditFile = has(request.getCgedit()) ? fileStorageService.storeCgEdit(request.getCgedit(), author) : null;
            StoredFile beforeFile = fileStorageService.storePostImage(request.getBefore(), author, "before.jpg");
            StoredFile afterFile = fileStorageService.storePostImage(request.getAfter(), author, "after.jpg");

            Post p = Post.builder()
                    .afterFile(afterFile)
                    .beforeFile(beforeFile)
                    .lutFile(lutFile)
                    .cgeditFile(cgeditFile)
                    .user(author)
                    .tags(tags)
                    .description(request.getDescription())
                    .title(request.getTitle().trim())
                    .build();
            postRepository.save(p);
            return postMapper.toDetail(p, author);
        } catch (IOException e) {
            throw new BusinessException(BusinessErrorCodes.FILE_UPLOAD_FAILED);
        }
    }

    @Transactional(readOnly = true)
    public PagedModel<PostSummaryResponse> list(User viewer, String author, String scope, String tag,
                                                String sort, int page, int size) {
        int pageNumber = Math.clamp(page, 0, Integer.MAX_VALUE);
        int pageSize = Math.clamp(size, 1, PostService.MAX_PAGE_SIZE);

        Page<Post> pageResult;
        if (author != null && !author.isBlank()) {
            pageResult = postRepository.findByAuthor(author.trim().toLowerCase(Locale.ROOT), PageRequest.of(pageNumber, pageSize));
        } else if (tag != null && !tag.isBlank()) {
            pageResult = postRepository.search(null, List.of(tag.trim().toLowerCase(Locale.ROOT)), PageRequest.of(pageNumber, pageSize, PostRepository.sortOf(sort)));
        } else if (scope.equalsIgnoreCase("following")) {
            if (viewer == null) {
                pageResult = Page.empty(PageRequest.of(pageNumber, pageSize));
            } else {
                pageResult = postRepository.findFollowingFeed(viewer.getId(), PageRequest.of(pageNumber, pageSize, PostRepository.sortOf(sort)));
            }
        } else {
            pageResult = postRepository.findFeed(PageRequest.of(pageNumber, pageSize, PostRepository.sortOf(sort)));
        }

        return postMapper.toPage(pageResult, viewer);
    }

    @Transactional(readOnly = true)
    public PostDetailResponse get(Integer id, User viewer) {
        Post p = postRepository.findWithFilesById(id)
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.POST_NOT_FOUND));

        if (!p.getUser().isEnabled() || !p.getUser().isAccountNonLocked()) {
            throw new BusinessException(BusinessErrorCodes.POST_NOT_FOUND);
        }

        return postMapper.toDetail(p, viewer);
    }

    @Transactional
    public PostDetailResponse update(Integer id, User user, UpdatePostRequest request) {
        Post p = findOwnPost(id, user);
        if (request.title() != null) {
            p.setTitle(request.title().trim());
        }
        if (request.tags() != null) {
            p.getTags().clear();
            p.getTags().addAll(resolveTags(request.tags()));
        }
        if (request.description() != null) {
            p.setDescription(request.description().trim());
        }
        p.setUpdatedAt(LocalDateTime.now());
        postRepository.save(p);
        return postMapper.toDetail(p, user);
    }

    @Transactional
    public void delete(Integer id, User user) {
        Post p = postRepository.findWithFilesById(id)
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.POST_NOT_FOUND));
        boolean admin = "ROLE_ADMIN".equals(user.getUserRole().getName());
        if (!PostMapper.isOwner(p, user) && !admin) {
            throw new BusinessException(BusinessErrorCodes.NOT_POST_OWNER);
        }
        likeRepository.deleteAllByPostId(id);
        savedPostRepository.deleteAllByPostId(id);
        postRepository.delete(p);

        for (var item : Arrays.asList(p.getBeforeFile(), p.getAfterFile(), p.getLutFile(), p.getCgeditFile())) {
            if (item != null) {
                fileStorageService.delete(item);
            }
        }
    }

    @Transactional
    public void like(Integer id, User user) {
        User u = userRepository.findUserById(user.getId())
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));

        if (likeRepository.existsByPostIdAndUserId(id, u.getId())) {
            return;
        }

        Like l = new Like();
        l.setPost(postRepository.findById(id)
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.POST_NOT_FOUND)));
        l.setUser(u);
        likeRepository.save(l);
        postRepository.incrementLikes(id);
    }

    @Transactional
    public void unlike(Integer id, User user) {
        User u = userRepository.findUserById(user.getId())
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));

        if (!likeRepository.existsByPostIdAndUserId(id, u.getId())) {
            return;
        }

        int removed = likeRepository.deleteByPostIdAndUserId(id, u.getId());
        if (removed > 0) {
            postRepository.decrementLikes(id);
        }
    }

    @Transactional
    public void save(Integer id, User user) {
        User u = userRepository.findUserById(user.getId())
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));

        if (savedPostRepository.existsByPostIdAndUserId(id, u.getId())) {
            return;
        }

        SavedPost s = new SavedPost();
        s.setPost(postRepository.findById(id)
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.POST_NOT_FOUND)));
        s.setUser(u);
        savedPostRepository.save(s);
    }

    @Transactional
    public void unsave(Integer id, User user) {
        savedPostRepository.deleteByPostIdAndUserId(id, user.getId());
    }

    @Transactional
    public void pin(Integer id, User user) {
        Post p = findOwnPost(id, user);
        postRepository.unpinAllFor(user.getId());
        p.setPinnedAt(LocalDateTime.now());
    }

    @Transactional
    public void unpin(Integer id, User user) {
        Post p = findOwnPost(id, user);
        p.setPinnedAt(null);
        postRepository.save(p);
    }

    private Post findOwnPost(Integer id, User user) {
        Post p = postRepository.findWithFilesById(id)
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.POST_NOT_FOUND));

        if (!PostMapper.isOwner(p, user)) {
            throw new BusinessException(BusinessErrorCodes.NOT_POST_OWNER);
        }

        return p;
    }

    private Set<Tag> resolveTags(List<String> slugs) {
        List<String> uniqueTags = slugs == null ? List.of() : slugs.stream()
                .filter(t -> t != null && !t.isBlank())
                .map(t -> t.toLowerCase(Locale.ROOT))
                .distinct()
                .toList();

        if (uniqueTags.isEmpty()) {
            return new HashSet<>();
        }

        if (uniqueTags.size() > CreatePostRequest.MAX_TAGS) {
            throw new BusinessException(BusinessErrorCodes.TOO_MANY_TAGS);
        }

        List<Tag> found = tagRepository.findBySlugIn(uniqueTags);
        if (found.size() != uniqueTags.size()) {
            throw new BusinessException(BusinessErrorCodes.UNKNOWN_TAG);
        }

        return new HashSet<>(found);
    }

    @Transactional
    public FileDownload download(Integer id, FileType kind) {
        Post p = postRepository.findWithFilesById(id)
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.POST_NOT_FOUND));

        if (!p.getUser().isEnabled() || !p.getUser().isAccountNonLocked()) {
            throw new BusinessException(BusinessErrorCodes.POST_NOT_FOUND);
        }

        StoredFile file = fileStorageService.requireType(
                kind == FileType.LUT ? p.getLutFile() : p.getCgeditFile(), kind);
        postRepository.incrementDownloads(id);
        return fileStorageService.open(file);
    }

    @Transactional(readOnly = true)
    public PagedModel<PostSummaryResponse> saved(User user, int page, int size) {
        int pageNumber = Math.clamp(page, 0, Integer.MAX_VALUE);
        int pageSize = Math.clamp(size, 1, PostService.MAX_PAGE_SIZE);
        Page<Post> savedPosts = savedPostRepository.findSavedPosts(user.getId(), PageRequest.of(pageNumber, pageSize));
        return postMapper.toPage(savedPosts, user);
    }

    public long countByUser(Long userId) {
        return postRepository.countByUserId(userId);
    }
}
