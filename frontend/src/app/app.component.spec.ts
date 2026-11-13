// [AI-GENERATED] Replaces the Angular CLI starter tests (they expected a 'loginprojectapp' title and an h1)
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('creates the app with the CineGrade title', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    expect(app.title).toBe('CineGrade');
  });

  it('renders only the router outlet; every page comes from the routes', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('router-outlet')).not.toBeNull();
    expect(root.children.length).toBe(1);
  });
});
