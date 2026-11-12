// [AI-GENERATED]
import { Component, input, signal } from '@angular/core';

/**
 * Shows a photo before and after its grade.
 * - slider: drag the line (or use the arrow keys) to compare.
 * - hover:  shows the graded photo; hovering crossfades to the original.
 * Without image URLs it draws the built-in illustrated landscape, so it also works as a demo.
 */
@Component({
  selector: 'app-before-after',
  template: `
    <div
      class="frame"
      [class.frame--hover]="mode() === 'hover'"
      [style.--split]="split() + '%'"
      [style.aspect-ratio]="ratio()"
    >
      <div class="layer layer--after">
        @if (afterSrc(); as src) {
          <img [src]="src" [alt]="alt() + ', after'" loading="lazy" decoding="async" />
        } @else {
          <div class="art art--after"></div>
        }
      </div>
      <div class="layer layer--before">
        @if (beforeSrc(); as src) {
          <img [src]="src" [alt]="alt() + ', before'" loading="lazy" decoding="async" />
        } @else {
          <div class="art art--before"></div>
        }
      </div>

      @if (mode() === 'slider') {
        <div class="handle" aria-hidden="true"><span class="knob"><i class="fa-solid fa-arrows-left-right"></i></span></div>
        @if (labels()) {
          <span class="label">Before</span>
          <span class="label label--after">After</span>
        }
        <input
          class="range"
          type="range"
          min="0"
          max="100"
          step="1"
          [value]="split()"
          (input)="split.set(+$any($event.target).value)"
          [attr.aria-label]="'Compare ' + alt() + ' before and after'"
        />
      }
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .frame {
      position: relative;
      overflow: hidden;
      background: var(--clr-surface-input);
      border-radius: inherit;
      user-select: none;
    }

    .layer {
      position: absolute;
      inset: 0;
    }

    .layer img,
    .art {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* The original sits on top and is cut off at the line, so the graded photo shows on the right. */
    .layer--before {
      clip-path: inset(0 calc(100% - var(--split)) 0 0);
    }

    .frame--hover .layer--before {
      clip-path: none;
      opacity: 0;
      transition: opacity 260ms ease;
    }

    .frame--hover:hover .layer--before,
    .frame--hover:focus-within .layer--before {
      opacity: 1;
    }

    /* The same landscape as on the About page, graded only by the filter. */
    .art {
      background:
        radial-gradient(circle at 68% 54%, #ffe2a8 0 6%, rgba(255, 190, 110, 0.75) 7%, transparent 34%),
        linear-gradient(172deg, transparent 0 66%, #27362f 66.4% 100%),
        linear-gradient(186deg, transparent 0 58%, #4c5f55 58.4% 100%),
        linear-gradient(#5f7f9f 0%, #d9a57c 58%, #d9a57c 100%);
    }

    .art--before {
      filter: saturate(0.3) contrast(0.72) brightness(1.08);
    }

    .art--after {
      filter: saturate(1.45) contrast(1.22);
    }

    .handle {
      position: absolute;
      top: 0;
      bottom: 0;
      left: var(--split);
      width: 2px;
      margin-left: -1px;
      /* [AI-GENERATED] Fixed colours, not theme tokens: the light theme turns --cream dark. */
      background: #fff;
      box-shadow: 0 0 6px rgba(0, 0, 0, 0.35);
      pointer-events: none;
    }

    .knob {
      position: absolute;
      top: 50%;
      left: 50%;
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      transform: translate(-50%, -50%);
      /* [AI-GENERATED] Always the main blue (#146bd1, --clr-blue in the dark theme) with a white arrow. */
      background: #146bd1;
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
      color: #fff;
      font-size: 13px;
    }

    .label {
      position: absolute;
      bottom: 12px;
      left: 14px;
      padding: 3px 8px;
      background: rgba(0, 0, 0, 0.45);
      border-radius: 4px;
      color: #fff9ec;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      pointer-events: none;
    }

    .label--after {
      right: 14px;
      left: auto;
    }

    /* An invisible range input over the whole picture: drag anywhere, keyboard works too. */
    .range {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      opacity: 0;
      cursor: ew-resize;
    }

    .frame:has(.range:focus-visible) .knob {
      outline: 2px solid var(--clr-blue-hover);
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      .frame--hover .layer--before {
        transition: none;
      }
    }
  `,
})
export class BeforeAfterComponent {
  readonly beforeSrc = input<string | null>(null);
  readonly afterSrc = input<string | null>(null);
  readonly alt = input('Photo');
  readonly mode = input<'slider' | 'hover'>('slider');
  readonly labels = input(true);
  readonly ratio = input<string>('4 / 5');

  readonly split = signal(50);
}
