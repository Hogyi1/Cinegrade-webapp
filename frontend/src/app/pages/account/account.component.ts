import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { USERNAME_PATTERN, USERNAME_RULE } from '../../auth/username-rule';
import { TokenService } from '../../services/token/token.service';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// Same as the description column on User.java.
export const MAX_DESCRIPTION_LENGTH = 750;

type Section = 'photo' | 'username' | 'description';

@Component({
  selector: 'app-account',
  imports: [FormsModule],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
})
export class AccountComponent {
  private readonly tokens = inject(TokenService);

  // WIRE: load the saved description and picture from GET /users/me.

  readonly usernameRule = USERNAME_RULE;
  readonly maxDescription = MAX_DESCRIPTION_LENGTH;

  readonly currentUsername = this.tokens.username;
  readonly username = signal(this.tokens.username() ?? '');
  readonly description = signal('');
  readonly photo = signal<File | null>(null);
  readonly photoPreview = signal<string | null>(null);
  readonly photoError = signal('');
  readonly notSaved = signal<Section | null>(null);

  readonly initial = computed(() => this.currentUsername()?.charAt(0).toUpperCase() ?? '?');
  readonly usernameChanged = computed(() => this.username() !== this.currentUsername());
  readonly usernameError = computed(() =>
    this.usernameChanged() && !USERNAME_PATTERN.test(this.username()) ? `Use ${USERNAME_RULE}` : '',
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.releasePreview());
  }

  onUsernameChange(value: string): void {
    this.username.set(value.toLowerCase());
    this.notSaved.set(null);
  }

  onDescriptionChange(value: string): void {
    this.description.set(value);
    this.notSaved.set(null);
  }

  onPhotoPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // Lets the user pick the same file again.
    if (!file) {
      return;
    }

    this.notSaved.set(null);
    if (!PHOTO_TYPES.includes(file.type)) {
      this.photoError.set('Choose a JPG, PNG or WebP image.');
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

  savePhoto(): void {
    // WIRE: PUT /users/me/avatar, multipart with this.photo().
    this.notSaved.set('photo');
  }

  saveUsername(): void {
    if (!this.usernameChanged() || this.usernameError()) {
      return;
    }
    // WIRE: PUT /users/me/username with { username: this.username() }.
    // Then call SessionService.refresh(), because the access token holds the old name.
    this.notSaved.set('username');
  }

  saveDescription(): void {
    // WIRE: PATCH /users/me with { description: this.description() }.
    this.notSaved.set('description');
  }

  private releasePreview(): void {
    const preview = this.photoPreview();
    if (preview) {
      URL.revokeObjectURL(preview);
    }
  }
}
