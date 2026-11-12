// [AI-GENERATED]
import { Component, input, model, output, signal } from '@angular/core';

/**
 * A box you can click or drop a file on. Shows the chosen file's name, or an image preview
 * when [previewUrl] is set. The parent checks the file and sets [error].
 */
@Component({
  selector: 'app-file-drop',
  template: `
    <label
      class="drop"
      [class.drop--over]="over()"
      [class.drop--filled]="file()"
      [class.drop--invalid]="error()"
      [class.drop--image]="previewUrl()"
      (dragover)="onDragOver($event)"
      (dragleave)="over.set(false)"
      (drop)="onDrop($event)"
    >
      <input type="file" class="input" [accept]="accept()" (change)="onPicked($event)" />
      @if (previewUrl(); as url) {
        <img class="preview" [src]="url" alt="" />
      }
      <span class="body">
        <i [class]="file() ? 'fa-solid fa-circle-check' : icon()" aria-hidden="true"></i>
        <span class="label">{{ label() }}</span>
        @if (file(); as f) {
          <span class="name">{{ f.name }}</span>
        } @else {
          <span class="hint">{{ hint() }}</span>
        }
      </span>
    </label>
    @if (file()) {
      <button type="button" class="clear" (click)="clear()">Remove</button>
    }
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 6px;
      align-content: start;
    }

    .drop {
      position: relative;
      display: grid;
      place-items: center;
      min-height: 120px;
      overflow: hidden;
      padding: 16px;
      background: var(--clr-surface-input);
      border: 1.5px dashed var(--clr-border);
      border-radius: 10px;
      text-align: center;
      cursor: pointer;
      transition: border-color 120ms ease, background 120ms ease;
    }

    .drop:hover,
    .drop--over {
      border-color: var(--clr-blue-hover);
    }

    .drop--over {
      background: color-mix(in srgb, var(--clr-blue) 10%, var(--clr-surface-input));
    }

    .drop--filled {
      border-style: solid;
    }

    .drop--invalid {
      border-color: var(--clr-danger);
    }

    .drop--image {
      aspect-ratio: 4 / 5;
      min-height: 0;
      padding: 0;
    }

    .drop:focus-within {
      outline: 2px solid var(--clr-blue-hover);
      outline-offset: 2px;
    }

    /* Covers the box so clicking anywhere opens the picker, and stays keyboard-focusable. */
    .input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }

    .preview {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .body {
      position: relative;
      display: grid;
      justify-items: center;
      gap: 4px;
      pointer-events: none;
    }

    .drop--image .body {
      align-self: end;
      width: 100%;
      padding: 10px;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
      color: #fff;
    }

    .body i {
      font-size: 20px;
      color: var(--clr-text-muted);
    }

    .drop--filled .body i {
      color: var(--clr-success);
    }

    .label {
      font-size: 14px;
      font-weight: 700;
    }

    .hint,
    .name {
      max-width: 100%;
      overflow: hidden;
      color: var(--clr-text-muted);
      font-size: 12px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .drop--image .hint,
    .drop--image .name {
      color: rgba(255, 255, 255, 0.8);
    }

    .clear {
      justify-self: start;
      padding: 0;
      background: none;
      border: 0;
      color: var(--clr-text-muted);
      font: inherit;
      font-size: 13px;
      text-decoration: underline;
      cursor: pointer;
    }

    .clear:hover {
      color: var(--clr-text-primary);
    }

    .error {
      margin: 0;
      color: var(--error-text);
      font-size: 13px;
    }
  `,
})
export class FileDropComponent {
  readonly label = input.required<string>();
  readonly hint = input('');
  readonly accept = input('');
  readonly icon = input('fa-solid fa-arrow-up-from-bracket');
  readonly previewUrl = input<string | null>(null);
  readonly error = input('');

  readonly file = model<File | null>(null);
  /** Fires with every file the user picks or drops; the parent decides whether to keep it. */
  readonly picked = output<File>();

  readonly over = signal(false);

  onPicked(event: Event): void {
    const el = event.target as HTMLInputElement;
    const f = el.files?.[0];
    el.value = ''; // Lets the same file be picked again after Remove.
    if (f) {
      this.picked.emit(f);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.over.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.over.set(false);
    const f = event.dataTransfer?.files?.[0];
    if (f) {
      this.picked.emit(f);
    }
  }

  clear(): void {
    this.file.set(null);
  }
}
