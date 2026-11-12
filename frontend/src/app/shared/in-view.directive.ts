// [AI-GENERATED]
import { DestroyRef, Directive, ElementRef, inject, output } from '@angular/core';

/** Emits (appInView) when the element gets near the screen. Used to load the next page. */
@Directive({ selector: '[appInView]' })
export class InViewDirective {
  readonly appInView = output<void>();

  constructor() {
    const element: HTMLElement = inject(ElementRef).nativeElement;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.appInView.emit();
        }
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(element);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
