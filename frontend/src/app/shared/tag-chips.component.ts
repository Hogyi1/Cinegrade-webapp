// [AI-GENERATED]
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TagResponse } from '../services/models/tag-response';

/** A post's tags as small pills. Each one opens the search for that tag. */
@Component({
  selector: 'app-tag-chips',
  imports: [RouterLink],
  template: `
    @if (tags().length) {
      <ul class="chips" aria-label="Tags">
        @for (tag of tags(); track tag.slug) {
          <li>
            <a class="chip" routerLink="/search" [queryParams]="{ tags: tag.slug }">{{ tag.name }}</a>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .chip {
      display: inline-block;
      padding: 4px 10px;
      background: var(--clr-surface-input);
      border: 1px solid var(--clr-border-subtle);
      border-radius: 999px;
      color: var(--clr-text-secondary);
      font-size: 12px;
      font-weight: 600;
      line-height: 1.3;
      text-decoration: none;
      white-space: nowrap;
    }

    .chip:hover {
      border-color: var(--clr-border);
      color: var(--clr-text-primary);
    }

    .chip:focus-visible {
      outline: 2px solid var(--clr-blue-hover);
      outline-offset: 2px;
    }
  `,
})
export class TagChipsComponent {
  readonly tags = input<TagResponse[]>([]);
}
