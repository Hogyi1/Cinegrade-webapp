// [AI-GENERATED]
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PostsService } from '../../services/services/posts.service';
import { BeforeAfterComponent } from '../../shared/before-after.component';
import { FileDropComponent } from '../../shared/file-drop.component';
import { TagPickerComponent } from '../../shared/tag-picker.component';
import { MAX_TAGS } from '../../shared/tags.store';
import { businessErrorCode, errorMessages } from '../../shared/api-error';
import {
  DesktopPublishEvent,
  DesktopPublishRequest,
  SHARE_DRAFT_PARAM,
  SHARE_DRAFT_VALUE,
  desktopBridge,
  isDesktop,
  parseShareDraft,
  toFile,
  waitForBridge,
} from '../../shared/desktop';

// Same limits as CreatePostRequest.java and FileStorageService.java.
export const MAX_TITLE = 120;
export const MAX_DESCRIPTION = 2000;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png'];

// Same numbers as BusinessErrorCodes.java.
const INVALID_FILE = 312;
const TOO_MANY_TAGS = 323;
const UNKNOWN_TAG = 324;
const POST_FILE_REQUIRED = 325;

type Slot = 'before' | 'after' | 'lut' | 'cgedit';

/** /upload: share a grade as a before/after pair plus a LUT and/or a .cgedit file. */
@Component({
  selector: 'app-upload',
  imports: [FormsModule, BeforeAfterComponent, FileDropComponent, TagPickerComponent],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css',
  // [AI-GENERATED] The desktop app reports a publish back here
  host: { '(window:cg-desktop)': 'onDesktopEvent($event)' },
})
export class UploadComponent {
  private readonly posts = inject(PostsService);
  private readonly router = inject(Router);

  readonly maxTitle = MAX_TITLE;
  readonly maxDescription = MAX_DESCRIPTION;
  readonly maxTags = MAX_TAGS;

  readonly title = signal('');
  readonly description = signal('');
  readonly tags = signal<string[]>([]);

  readonly before = signal<File | null>(null);
  readonly after = signal<File | null>(null);
  readonly lut = signal<File | null>(null);
  readonly cgedit = signal<File | null>(null);
  readonly beforeUrl = signal<string | null>(null);
  readonly afterUrl = signal<string | null>(null);

  readonly fileErrors = signal<Record<Slot, string>>({ before: '', after: '', lut: '', cgedit: '' });
  readonly submitted = signal(false);
  readonly sending = signal(false);
  readonly errors = signal<string[]>([]);

  readonly titleError = computed(() =>
    this.submitted() && !this.title().trim() ? 'Give your post a title.' : '',
  );
  readonly gradeFileError = computed(() =>
    this.submitted() && !this.lut() && !this.cgedit() ? 'Add a LUT, a .cgedit file, or both.' : '',
  );
  readonly imagesError = computed(() =>
    this.submitted() && (!this.before() || !this.after()) ? 'Add both the before and the after photo.' : '',
  );
  readonly ready = computed(
    () => !!this.title().trim() && !!this.before() && !!this.after() && (!!this.lut() || !!this.cgedit()),
  );

  // [AI-GENERATED] Desktop app: the files its preset menu's Share exported
  readonly fromDesktop =
    isDesktop() && inject(ActivatedRoute).snapshot.queryParamMap.get(SHARE_DRAFT_PARAM) === SHARE_DRAFT_VALUE;
  readonly draftLoading = signal(false);
  readonly draftError = signal('');

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.revoke(this.beforeUrl());
      this.revoke(this.afterUrl());
    });
    if (this.fromDesktop) {
      void this.loadDesktopDraft();
    }
  }

  // [AI-GENERATED METHOD]
  // Fills the form like a person picking the files would, so the same checks apply; tags are left to the user.
  private async loadDesktopDraft(): Promise<void> {
    this.draftLoading.set(true);
    const bridge = await waitForBridge();
    const draft = parseShareDraft(bridge?.shareDraft());
    this.draftLoading.set(false);
    if (!draft) {
      this.draftError.set("Couldn't load the files from the app. Go back and use Share on the preset again.");
      return;
    }
    try {
      this.title.set(draft.title.slice(0, MAX_TITLE));
      this.description.set((draft.description ?? '').slice(0, MAX_DESCRIPTION));
      this.pickImage('before', toFile(draft.before));
      this.pickImage('after', toFile(draft.after));
      if (draft.lut) {
        this.pickGradeFile('lut', toFile(draft.lut));
      }
      if (draft.cgedit) {
        this.pickGradeFile('cgedit', toFile(draft.cgedit));
      }
    } catch {
      // atob throws on broken base64
      this.draftError.set("The files from the app couldn't be read. Use Share on the preset again.");
    }
  }

  pickImage(slot: 'before' | 'after', file: File): void {
    if (!IMAGE_TYPES.includes(file.type)) {
      return this.setError(slot, 'Choose a JPG or PNG image.');
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return this.setError(slot, 'Choose an image of 15 MB or less.');
    }
    this.setError(slot, '');
    this.setImage(slot, file);
  }

  /** Called with null when the drop zone's Remove is clicked. */
  setImage(slot: 'before' | 'after', file: File | null): void {
    const url = slot === 'before' ? this.beforeUrl : this.afterUrl;
    this.revoke(url());
    url.set(file ? URL.createObjectURL(file) : null);
    (slot === 'before' ? this.before : this.after).set(file);
  }

  pickGradeFile(slot: 'lut' | 'cgedit', file: File): void {
    const ext = slot === 'lut' ? '.cube' : '.cgedit';
    if (!file.name.toLowerCase().endsWith(ext)) {
      return this.setError(slot, `Choose a ${ext} file.`);
    }
    if (file.size > MAX_FILE_BYTES) {
      return this.setError(slot, 'Choose a file of 50 MB or less.');
    }
    this.setError(slot, '');
    (slot === 'lut' ? this.lut : this.cgedit).set(file);
  }

  /** Swaps the two photos, for when they were dropped the wrong way round. */
  swapImages(): void {
    const [b, a, bu, au] = [this.before(), this.after(), this.beforeUrl(), this.afterUrl()];
    this.before.set(a);
    this.after.set(b);
    this.beforeUrl.set(au);
    this.afterUrl.set(bu);
  }

  submit(): void {
    this.submitted.set(true);
    if (!this.ready() || this.sending()) {
      return;
    }
    this.sending.set(true);
    this.errors.set([]);
    if (this.fromDesktop) {
      this.publishInApp();
      return;
    }
    this.posts
      .createPost({
        body: {
          title: this.title().trim(),
          description: this.description().trim() || undefined,
          tags: this.tags(),
          before: this.before()!,
          after: this.after()!,
          lut: this.lut() ?? undefined,
          cgedit: this.cgedit() ?? undefined,
        },
      })
      .subscribe({
        next: (post) => this.router.navigate(['/posts', post.id]),
        error: (err: HttpErrorResponse) => {
          this.sending.set(false);
          this.errors.set(this.messageFor(err));
        },
      });
  }

  // [AI-GENERATED METHOD]
  // The WebView can't send this form's files, so the app posts them; the answer is a 'publish' cg-desktop event
  private publishInApp(): void {
    const bridge = desktopBridge();
    if (!bridge) {
      this.sending.set(false);
      this.errors.set(['The app is still loading. Try again in a moment.']);
      return;
    }
    const request: DesktopPublishRequest = {
      title: this.title().trim(),
      description: this.description().trim() || undefined,
      tags: this.tags(),
    };
    bridge.publish(JSON.stringify(request));
  }

  // [AI-GENERATED METHOD]
  onDesktopEvent(event: Event): void {
    const detail = (event as CustomEvent<DesktopPublishEvent>).detail;
    if (detail?.type !== 'publish' || !this.sending()) {
      return;
    }
    if (detail.status === 'done' && detail.postId > 0) {
      void this.router.navigate(['/posts', detail.postId]);
      return;
    }
    this.sending.set(false);
    this.errors.set([
      detail.status === 'signin'
        ? 'Sign in again to post.'
        : detail.status === 'offline'
          ? "Can't reach CineGrade. Check your connection and try again."
          : "Couldn't publish your post. Try again in a moment.",
    ]);
  }

  private messageFor(err: HttpErrorResponse): string[] {
    switch (businessErrorCode(err)) {
      case INVALID_FILE:
        return [
          "One of the files couldn't be read. Use JPG or PNG photos, and a LUT or .cgedit file exported from the CineGrade app.",
        ];
      case TOO_MANY_TAGS:
        return [`Pick at most ${MAX_TAGS} tags.`];
      case UNKNOWN_TAG:
        return ['One of the tags no longer exists. Reload the page and pick again.'];
      case POST_FILE_REQUIRED:
        return ['Add a LUT, a .cgedit file, or both.'];
    }
    if (err.status === 413) {
      return ['Those files are too big to upload together. Try smaller photos.'];
    }
    return errorMessages(err, "Couldn't publish your post. Try again in a moment.");
  }

  private setError(slot: Slot, message: string): void {
    this.fileErrors.update((e) => ({ ...e, [slot]: message }));
  }

  private revoke(url: string | null): void {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}
