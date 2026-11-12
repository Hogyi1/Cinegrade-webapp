// [AI-GENERATED]
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiConfiguration } from '../services/api-configuration';
import { PostSummaryResponse } from '../services/models/post-summary-response';
import { fileUrl } from '../auth/current-user.service';
import { BeforeAfterComponent } from './before-after.component';
import { CompactNumberPipe } from './compact-number.pipe';

/** One square in a profile grid: the graded photo, the original on hover, and the counts. */
@Component({
  selector: 'app-post-tile',
  imports: [RouterLink, BeforeAfterComponent, CompactNumberPipe],
  template: `
    <a class="tile" [routerLink]="['/posts', post().id]" [attr.aria-label]="post().title">
      <app-before-after
        mode="hover"
        ratio="4 / 5"
        [beforeSrc]="beforeUrl()"
        [afterSrc]="afterUrl()"
        [alt]="post().title ?? 'Post'"
      >
        <div class="overlay" aria-hidden="true">
          <span><i class="fa-solid fa-heart"></i> {{ post().likeCount ?? 0 | compactNumber }}</span>
          <span><i class="fa-solid fa-download"></i> {{ post().downloadCount ?? 0 | compactNumber }}</span>
        </div>
      </app-before-after>
      @if (post().pinned) {
        <span class="pin" title="Pinned"><i class="fa-solid fa-thumbtack" aria-hidden="true"></i></span>
      }
    </a>
  `,
  styles: `
    :host {
      display: block;
    }

    .tile {
      position: relative;
      display: block;
      overflow: hidden;
      border-radius: 4px;
      color: #fff;
    }

    .tile:focus-visible {
      outline: 2px solid var(--clr-blue-hover);
      outline-offset: 2px;
    }

    app-before-after {
      border-radius: 4px;
    }

    .overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 22px;
      background: rgba(0, 0, 0, 0.38);
      font-size: 15px;
      font-weight: 700;
      opacity: 0;
      transition: opacity 180ms ease;
    }

    .overlay i {
      margin-right: 6px;
    }

    .tile:hover .overlay,
    .tile:focus-visible .overlay {
      opacity: 1;
    }

    .pin {
      position: absolute;
      top: 8px;
      right: 8px;
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 50%;
      font-size: 12px;
      transform: rotate(35deg);
    }

    @media (hover: none) {
      .overlay {
        display: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .overlay {
        transition: none;
      }
    }
  `,
})
export class PostTileComponent {
  private readonly rootUrl = inject(ApiConfiguration).rootUrl;

  readonly post = input.required<PostSummaryResponse>();

  readonly beforeUrl = computed(() => fileUrl(this.rootUrl, this.post().beforeFileId));
  readonly afterUrl = computed(() => fileUrl(this.rootUrl, this.post().afterFileId));
}
