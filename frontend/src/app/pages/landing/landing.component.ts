import { Component, ElementRef, viewChild } from '@angular/core';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  private readonly about = viewChild.required<ElementRef<HTMLElement>>('about');

  showAbout(): void {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.about().nativeElement.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}
