// [AI-GENERATED]
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, map } from 'rxjs';
import { ApiConfiguration } from '../../services/api-configuration';
import { PostDetailResponse } from '../../services/models/post-detail-response';
import { PostsService } from '../../services/services/posts.service';
import { TokenService } from '../../services/token/token.service';
import { fileUrl } from '../../auth/current-user.service';
import { BeforeAfterComponent } from '../../shared/before-after.component';
import { CompactNumberPipe } from '../../shared/compact-number.pipe';
import { PostActionsService } from '../../shared/post-actions.service';
import { TagChipsComponent } from '../../shared/tag-chips.component';
import { TagPickerComponent } from '../../shared/tag-picker.component';
import { TimeAgoPipe } from '../../shared/time-ago.pipe';
import { MAX_TAGS } from '../../shared/tags.store';
import { parseServerTime } from '../../shared/server-time';
import { businessErrorCode, errorMessages } from '../../shared/api-error';
import { MAX_DESCRIPTION, MAX_TITLE } from '../upload/upload.component';
import {
  DesktopDownloadEvent,
  DesktopDownloadRequest,
  DownloadKind,
  desktopBridge,
  downloadFileName,
  isDesktop,
} from '../../shared/desktop';

type Kind = DownloadKind;

// Same number as BusinessErrorCodes.java. A missing file (326) is a 404 too, handled in download().
const POST_NOT_FOUND = 321;

/** /posts/:id: the big before/after, the downloads, and for the author: edit, pin and delete. */
@Component({
  selector: 'app-post',
  imports: [
    FormsModule,
    RouterLink,
    BeforeAfterComponent,
    CompactNumberPipe,
    TagChipsComponent,
    TagPickerComponent,
    TimeAgoPipe,
  ],
  templateUrl: './post.component.html',
  styleUrl: './post.component.css',
  // [AI-GENERATED] The desktop app reports downloads back here
  host: { '(window:cg-desktop)': 'onDesktopEvent($event)' },
})
export class PostComponent {
  private readonly api = inject(PostsService);
  private readonly http = inject(HttpClient);
  private readonly actions = inject(PostActionsService);
  private readonly router = inject(Router);
  private readonly rootUrl = inject(ApiConfiguration).rootUrl;

  readonly isLoggedIn = inject(TokenService).isLoggedIn;
  readonly maxTitle = MAX_TITLE;
  readonly maxDescription = MAX_DESCRIPTION;
  readonly maxTags = MAX_TAGS;

  readonly post = signal<PostDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly loadErrors = signal<string[]>([]);

  readonly downloading = signal<Kind | null>(null);
  readonly downloadError = signal('');
  // [AI-GENERATED] In the desktop app the file goes through the bridge, not the browser
  private readonly desktop = isDesktop();
  readonly downloadNotice = signal('');

  // Owner tools
  readonly editing = signal(false);
  readonly editTitle = signal('');
  readonly editDescription = signal('');
  readonly editTags = signal<string[]>([]);
  readonly saving = signal(false);
  readonly editErrors = signal<string[]>([]);
  readonly confirmingDelete = signal(false);
  readonly deleting = signal(false);
  readonly ownerErrors = signal<string[]>([]);

  readonly beforeUrl = computed(() => fileUrl(this.rootUrl, this.post()?.beforeFileId));
  readonly afterUrl = computed(() => fileUrl(this.rootUrl, this.post()?.afterFileId));
  readonly avatarUrl = computed(() => fileUrl(this.rootUrl, this.post()?.author?.avatarFileId));
  readonly edited = computed(() => {
    const p = this.post();
    // Pinning doesn't touch updatedAt in a way users care about, so only show it a minute after creating.
    return !!p?.updatedAt && !!p.createdAt && parseServerTime(p.updatedAt) - parseServerTime(p.createdAt) > 60_000;
  });

  private request?: Subscription;
  private id = 0;

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(
        map((params) => Number(params.get('id'))),
        takeUntilDestroyed(),
      )
      .subscribe((id) => this.open(id));
  }

  reload(): void {
    this.open(this.id);
  }

  like(): void {
    const p = this.post();
    if (p) {
      this.actions.toggleLike(p, (next) => this.post.set(next));
    }
  }

  save(): void {
    const p = this.post();
    if (p) {
      this.actions.toggleSave(p, (next) => this.post.set(next));
    }
  }

  /** Fetched with the login token (a plain link wouldn't send it), then handed to the browser as a file. */
  download(kind: Kind): void {
    const p = this.post();
    if (!p || this.downloading()) {
      return;
    }
    this.downloading.set(kind);
    this.downloadError.set('');
    this.downloadNotice.set('');
    if (this.desktop) {
      this.downloadInApp(p, kind);
      return;
    }
    this.http
      .get(`${this.rootUrl}/posts/${p.id}/download/${kind}`, { responseType: 'blob', observe: 'response' })
      .subscribe({
        next: (res) => {
          this.saveFile(res, kind === 'lut' ? 'cinegrade.cube' : 'cinegrade.cgedit');
          this.downloading.set(null);
          this.post.update((cur) => (cur ? { ...cur, downloadCount: (cur.downloadCount ?? 0) + 1 } : cur));
        },
        error: (err: HttpErrorResponse) => {
          this.downloading.set(null);
          this.downloadError.set(
            err.status === 401
              ? 'Sign in again to download.'
              : err.status === 404
                ? "This file isn't available any more."
                : err.status === 0
                  ? "Can't reach CineGrade. Check your connection and try again."
                  : "Couldn't download the file. Try again in a moment.",
          );
        },
      });
  }

  startEdit(): void {
    const p = this.post();
    if (!p) {
      return;
    }
    this.editTitle.set(p.title ?? '');
    this.editDescription.set(p.description ?? '');
    this.editTags.set((p.tags ?? []).map((t) => t.slug!).filter(Boolean));
    this.editErrors.set([]);
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  saveEdit(): void {
    const p = this.post();
    const title = this.editTitle().trim();
    if (!p || this.saving()) {
      return;
    }
    if (!title) {
      this.editErrors.set(['Give your post a title.']);
      return;
    }
    this.saving.set(true);
    this.editErrors.set([]);
    this.api
      .updatePost({
        id: p.id!,
        body: { title, description: this.editDescription().trim(), tags: this.editTags() },
      })
      .subscribe({
        next: (updated) => {
          this.post.set(updated);
          this.saving.set(false);
          this.editing.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.editErrors.set(errorMessages(err, "Couldn't save your changes. Try again in a moment."));
        },
      });
  }

  togglePin(): void {
    const p = this.post();
    if (!p) {
      return;
    }
    const pinned = p.pinned === true;
    this.post.set({ ...p, pinned: !pinned });
    this.ownerErrors.set([]);
    (pinned ? this.api.unpinPost({ id: p.id! }) : this.api.pinPost({ id: p.id! })).subscribe({
      error: (err: HttpErrorResponse) => {
        this.post.update((cur) => (cur ? { ...cur, pinned } : cur));
        this.ownerErrors.set(errorMessages(err, "Couldn't change the pin. Try again in a moment."));
      },
    });
  }

  deletePost(): void {
    const p = this.post();
    if (!p || this.deleting()) {
      return;
    }
    this.deleting.set(true);
    this.ownerErrors.set([]);
    this.api.deletePost({ id: p.id! }).subscribe({
      next: () => this.router.navigate(['/users', p.author?.username]),
      error: (err: HttpErrorResponse) => {
        this.deleting.set(false);
        this.confirmingDelete.set(false);
        this.ownerErrors.set(errorMessages(err, "Couldn't delete the post. Try again in a moment."));
      },
    });
  }

  private open(id: number): void {
    this.id = id;
    this.request?.unsubscribe();
    this.post.set(null);
    this.notFound.set(false);
    this.loadErrors.set([]);
    this.editing.set(false);
    this.confirmingDelete.set(false);
    this.downloadError.set('');

    if (!Number.isInteger(id) || id <= 0) {
      this.loading.set(false);
      this.notFound.set(true);
      return;
    }
    this.loading.set(true);
    this.request = this.api.getPost({ id }).subscribe({
      next: (post) => {
        this.post.set(post);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404 || businessErrorCode(err) === POST_NOT_FOUND) {
          this.notFound.set(true);
        } else {
          this.loadErrors.set(errorMessages(err, "Couldn't load this post. Try again in a moment."));
        }
      },
    });
  }

  // [AI-GENERATED METHOD]
  // WebView ignores <a download>, so the app saves the file itself; the answer comes back as a cg-desktop event.
  private downloadInApp(p: PostDetailResponse, kind: Kind): void {
    const bridge = desktopBridge();
    if (!bridge || p.id == null) {
      this.downloading.set(null);
      this.downloadError.set('The app is still loading. Try again in a moment.');
      return;
    }
    const request: DesktopDownloadRequest = { postId: p.id, kind, fileName: downloadFileName(p.title, kind) };
    bridge.download(JSON.stringify(request));
  }

  // [AI-GENERATED METHOD]
  onDesktopEvent(event: Event): void {
    const detail = (event as CustomEvent<DesktopDownloadEvent>).detail;
    if (detail?.type !== 'download' || detail.postId !== this.post()?.id || detail.kind !== this.downloading()) {
      return;
    }
    this.downloading.set(null);
    switch (detail.status) {
      case 'done':
        this.post.update((cur) => (cur ? { ...cur, downloadCount: (cur.downloadCount ?? 0) + 1 } : cur));
        // The app also imports a .cgedit into the preset panel
        this.downloadNotice.set(detail.kind === 'cgedit' ? 'Saved and added to your presets.' : 'LUT saved.');
        break;
      case 'cancelled':
        break;
      case 'signin':
        this.downloadError.set('Sign in again to download.');
        break;
      case 'offline':
        this.downloadError.set("Can't reach CineGrade. Check your connection and try again.");
        break;
      default:
        this.downloadError.set("Couldn't download the file. Try again in a moment.");
    }
  }

  private saveFile(res: HttpResponse<Blob>, fallbackName: string): void {
    const blob = res.body;
    if (!blob) {
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileNameFrom(res.headers.get('Content-Disposition')) ?? fallbackName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser a moment to start the download before the URL goes away.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/** Reads the name from `attachment; filename="x.cube"; filename*=UTF-8''x.cube`. */
function fileNameFrom(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      /* fall through to the plain name */
    }
  }
  return /filename="?([^";]+)"?/i.exec(header)?.[1] ?? null;
}
