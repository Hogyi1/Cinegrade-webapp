import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { USERNAME_PATTERN, USERNAME_RULE } from '../../auth/username-rule';
import { TokenService } from '../../services/token/token.service';
import { UsersService } from '../../services/services/users.service';
import { ApiConfiguration } from '../../services/api-configuration';
import { UserProfileResponse } from '../../services/models/user-profile-response';
import { businessErrorCode, errorMessages } from '../../shared/api-error';
import { CurrentUserService } from '../../auth/current-user.service';
// [AI-GENERATED] Server times are Hungarian time.
import { formatHungarian, serverDate } from '../../shared/server-time';
// [AI-GENERATED]
import { toProfileLink } from '../../shared/profile-link';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
// Same as IMAGE_FORMATS in FileStorageService.java.
const PHOTO_TYPES = ['image/jpeg', 'image/png'];
// Same as the description column on User.java.
export const MAX_DESCRIPTION_LENGTH = 750;
// [AI-GENERATED] Same limits and pattern as UpdateLinksRequest.java.
export const MAX_LINKS = 5;
export const MAX_LINK_LENGTH = 200;
const LINK_PATTERN = /^https?:\/\/[^\s/$.?#][^\s]*$/i;

// [AI-GENERATED] Same numbers as BusinessErrorCodes.java.
const USERNAME_TAKEN = 305;
const INVALID_FILE = 312;
const USERNAME_CHANGE_TOO_SOON = 313;

// [AI-GENERATED]
export type SaveStatus = 'idle' | 'saving' | 'saved';

@Component({
  selector: 'app-account',
  imports: [FormsModule],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
})
export class AccountComponent {
  private readonly tokens = inject(TokenService);
  private readonly userService = inject(UsersService);
  private readonly apiConfig = inject(ApiConfiguration);
  // [AI-GENERATED]
  private readonly currentUser = inject(CurrentUserService);

  readonly usernameRule = USERNAME_RULE;
  // [AI-GENERATED]
  readonly formatHungarian = formatHungarian;
  readonly maxDescription = MAX_DESCRIPTION_LENGTH;

  readonly currentUsername = this.tokens.username;
  readonly username = signal(this.tokens.username() ?? '');
  readonly description = signal('');
  readonly photo = signal<File | null>(null);
  readonly photoPreview = signal<string | null>(null);
  readonly photoError = signal('');

  // [AI-GENERATED] Server state and save status for each section.
  readonly loadErrors = signal<string[]>([]);
  readonly avatarFileId = signal<number | null>(null);
  readonly nextUsernameChangeAt = signal<Date | null>(null);
  readonly photoStatus = signal<SaveStatus>('idle');
  readonly photoErrors = signal<string[]>([]);
  readonly usernameStatus = signal<SaveStatus>('idle');
  readonly usernameErrors = signal<string[]>([]);
  readonly descriptionStatus = signal<SaveStatus>('idle');
  readonly descriptionErrors = signal<string[]>([]);
  // [AI-GENERATED] One entry per input row; blank rows are dropped on save.
  readonly links = signal<string[]>([]);
  readonly linksStatus = signal<SaveStatus>('idle');
  readonly linksErrors = signal<string[]>([]);
  readonly maxLinks = MAX_LINKS;
  readonly maxLinkLength = MAX_LINK_LENGTH;

  // [AI-GENERATED] Per row: '' when fine. Blank rows count as fine because save skips them.
  readonly linkErrors = computed(() =>
    this.links().map((link) => {
      const value = link.trim();
      if (!value) return '';
      if (value.length > MAX_LINK_LENGTH) return `Use at most ${MAX_LINK_LENGTH} characters.`;
      return LINK_PATTERN.test(value) ? '' : 'Start the link with https:// or http://';
    }),
  );
  // [AI-GENERATED] What each row will look like on the profile, or null while it's blank or invalid.
  readonly linkPreviews = computed(() =>
    this.links().map((link, i) => (link.trim() && !this.linkErrors()[i] ? toProfileLink(link.trim()) : null)),
  );
  readonly linksInvalid = computed(() => this.linkErrors().some((e) => e !== ''));

  readonly initial = computed(() => this.currentUsername()?.charAt(0).toUpperCase() ?? '?');
  readonly usernameChanged = computed(() => this.username() !== this.currentUsername());
  readonly usernameError = computed(() =>
    this.usernameChanged() && !USERNAME_PATTERN.test(this.username()) ? `Use ${USERNAME_RULE}` : '',
  );

  // [AI-GENERATED] /files/{id} is public, so a plain <img src> works without the auth header.
  readonly avatarUrl = computed(() => {
    const id = this.avatarFileId();
    return id === null ? null : `${this.apiConfig.rootUrl}/files/${id}`;
  });

  // [AI-GENERATED] Null when the username can be changed right now.
  readonly usernameLockedUntil = computed(() => {
    const next = this.nextUsernameChangeAt();
    return next && next.getTime() > Date.now() ? next : null;
  });

  // [AI-GENERATED]
  constructor() {
    inject(DestroyRef).onDestroy(() => this.releasePreview());

    // [AI-GENERATED] Through the shared store, so the header's request and this one are the same.
    this.currentUser
      .load()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (profile) => {
          this.applyProfile(profile);
          this.description.set(profile.description ?? '');
          // [AI-GENERATED]
          this.links.set([...(profile.links ?? [])]);
        },
        error: (err: HttpErrorResponse) =>
          this.loadErrors.set(errorMessages(err, "Couldn't load your profile. Reload the page to try again.")),
      });
  }

  onUsernameChange(value: string): void {
    this.username.set(value.toLowerCase());
    this.usernameStatus.set('idle');
    this.usernameErrors.set([]);
  }

  onDescriptionChange(value: string): void {
    this.description.set(value);
    this.descriptionStatus.set('idle');
    this.descriptionErrors.set([]);
  }

  onPhotoPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // Lets the user pick the same file again.
    if (!file) {
      return;
    }

    this.photoStatus.set('idle');
    this.photoErrors.set([]);
    if (!PHOTO_TYPES.includes(file.type)) {
      this.photoError.set('Choose a JPG or PNG image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      this.photoError.set('Choose an image of 5 MB or less.');
      return;
    }

    this.photoError.set('');
    this.releasePreview();
    this.photo.set(file);
    this.photoPreview.set(URL.createObjectURL(file));
  }

  // [AI-GENERATED]
  savePhoto(): void {
    const file = this.photo();
    if (!file || this.photoStatus() === 'saving') {
      return;
    }
    this.photoStatus.set('saving');
    this.photoErrors.set([]);
    this.userService.changeAvatar({ body: { file } }).subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.photo.set(null);
        this.releasePreview();
        this.photoPreview.set(null);
        this.photoStatus.set('saved');
      },
      error: (err: HttpErrorResponse) => {
        this.photoStatus.set('idle');
        this.photoErrors.set(
          businessErrorCode(err) === INVALID_FILE
            ? ["That file isn't a picture we can use. Choose a JPG or PNG image."]
            : errorMessages(err, "Couldn't save your photo. Try again in a moment."),
        );
      },
    });
  }

  // [AI-GENERATED]
  saveUsername(): void {
    if (!this.usernameChanged() || this.usernameError() || this.usernameStatus() === 'saving') {
      return;
    }
    this.usernameStatus.set('saving');
    this.usernameErrors.set([]);
    this.userService.changeUsername({ body: { username: this.username() } }).subscribe({
      next: (res) => {
        // The response carries a new access token with the new "username" claim,
        // so currentUsername and the header update from it.
        this.tokens.token = res.token as string;
        this.username.set(this.tokens.username() ?? this.username());
        this.usernameStatus.set('saved');
        this.reloadUsernameCooldown();
      },
      error: (err: HttpErrorResponse) => this.onUsernameError(err),
    });
  }

  // [AI-GENERATED]
  saveDescription(): void {
    if (this.descriptionStatus() === 'saving') {
      return;
    }
    this.descriptionStatus.set('saving');
    this.descriptionErrors.set([]);
    this.userService.changeDescription({ body: { description: this.description() } }).subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.description.set(profile.description ?? '');
        this.descriptionStatus.set('saved');
      },
      error: (err: HttpErrorResponse) => {
        this.descriptionStatus.set('idle');
        this.descriptionErrors.set(errorMessages(err, "Couldn't save your description. Try again in a moment."));
      },
    });
  }

  // [AI-GENERATED]
  onLinkChange(index: number, value: string): void {
    this.links.update((links) => links.map((link, i) => (i === index ? value : link)));
    this.linksStatus.set('idle');
    this.linksErrors.set([]);
  }

  // [AI-GENERATED]
  addLink(): void {
    if (this.links().length < MAX_LINKS) {
      this.links.update((links) => [...links, '']);
      this.linksStatus.set('idle');
    }
  }

  // [AI-GENERATED]
  removeLink(index: number): void {
    this.links.update((links) => links.filter((_, i) => i !== index));
    this.linksStatus.set('idle');
    this.linksErrors.set([]);
  }

  // [AI-GENERATED] Sends the whole list; the server replaces what was there.
  saveLinks(): void {
    if (this.linksInvalid() || this.linksStatus() === 'saving') {
      return;
    }
    const links = this.links()
      .map((link) => link.trim())
      .filter((link) => link !== '');
    this.linksStatus.set('saving');
    this.linksErrors.set([]);
    this.userService.changeLinks({ body: { links } }).subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.links.set([...(profile.links ?? [])]);
        this.linksStatus.set('saved');
      },
      error: (err: HttpErrorResponse) => {
        this.linksStatus.set('idle');
        this.linksErrors.set(errorMessages(err, "Couldn't save your links. Try again in a moment."));
      },
    });
  }

  // [AI-GENERATED]
  private onUsernameError(err: HttpErrorResponse): void {
    this.usernameStatus.set('idle');
    switch (businessErrorCode(err)) {
      case USERNAME_TAKEN:
        this.usernameErrors.set(['Someone already has that username. Try another one.']);
        return;
      case USERNAME_CHANGE_TOO_SOON:
        this.usernameErrors.set(["You've changed your username too recently."]);
        this.reloadUsernameCooldown();
        return;
    }
    this.usernameErrors.set(errorMessages(err, "Couldn't change your username. Try again in a moment."));
  }

  // [AI-GENERATED] The username endpoint only returns a token, so ask again for the new cooldown.
  private reloadUsernameCooldown(): void {
    this.currentUser.load().subscribe({
      next: (profile) => this.applyProfile(profile),
      error: () => undefined,
    });
  }

  // [AI-GENERATED] Takes the parts every profile response shares. Leaves the description
  // field alone, so a reload never overwrites what the user is typing.
  private applyProfile(profile: UserProfileResponse): void {
    // [AI-GENERATED] Keeps the header picture in step with what was just saved.
    this.currentUser.set(profile);
    this.avatarFileId.set(profile.avatarFileId ?? null);
    this.nextUsernameChangeAt.set(profile.nextUsernameChangeAt ? serverDate(profile.nextUsernameChangeAt) : null);
  }

  private releasePreview(): void {
    const preview = this.photoPreview();
    if (preview) {
      URL.revokeObjectURL(preview);
    }
  }
}
