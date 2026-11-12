import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DESKTOP_DOWNLOAD_URL } from '../../shared/links';
import { TokenService } from '../../services/token/token.service';

// [AI-GENERATED] The desktop app screenshots live in public/images/app/.
const SHOT = (file: string) => `images/app/${file}`;

// [AI-GENERATED] One row per part of the app, each with its real screenshot.
export interface FeatureRow {
  label: string;
  title: string;
  text: string;
  points: string[];
  shot: string;
  alt: string;
  /** A smaller screenshot laid over the corner of the main one. */
  inset?: { shot: string; alt: string; wide?: boolean };
}

// [AI-GENERATED]
const ROWS: FeatureRow[] = [
  {
    label: '01 · Import',
    title: 'Bring in a whole shoot',
    text: 'Drop a folder in, pick the frames you want, and start. RAW and JPEG pairs are matched for you, and duplicates are left out.',
    points: ['RAW + JPEG auto pairing', 'Duplicate detection', 'Select, deselect, search'],
    shot: SHOT('import.jpg'),
    alt: 'The import screen with a grid of staged RAW photos, some selected',
  },
  {
    label: '02 · Develop',
    title: 'Grade with tools that answer instantly',
    text: 'White balance, tone and a colour mixer for every hue, all running on the GPU. The histogram shows clipped shadows and highlights as you move a slider.',
    points: ['Temperature, tint and a picker', 'Exposure to blacks', 'Hue, saturation, luminance per colour'],
    shot: SHOT('develop.jpg'),
    alt: 'The develop screen: presets on the left, the photo in the middle, the histogram and sliders on the right',
    inset: { shot: SHOT('edit-panel.jpg'), alt: 'The edit panel with the histogram, white balance and tone sliders' },
  },
  {
    label: '03 · Organise',
    title: 'Rate, label and leave notes',
    text: 'Give the keepers stars and a colour, mark favourites, and pin a note to a photo for later. Filter the filmstrip down to exactly the frames you need.',
    points: ['Star ratings and colour labels', 'Notes on any photo', 'Filter and search by file name'],
    shot: SHOT('comment.jpg'),
    alt: 'A note being added to a photo in the filmstrip, with rated and colour-labelled thumbnails',
  },
  {
    label: '04 · Export',
    title: 'Take the look with you',
    text: 'Export finished photos as JPEG, PNG or TIFF, or turn the grade into a 3D LUT that other software can load. Leave exposure and white balance out, and the look fits any photo.',
    points: ['JPEG, PNG and TIFF', '.cube LUTs at 17, 33 or 65', 'Batch export by filter or import'],
    shot: SHOT('export-photos.jpg'),
    alt: 'The export screen with photo selection and file settings',
    inset: { shot: SHOT('export-lut.jpg'), alt: 'The 3D LUT export settings', wide: true },
  },
];

// [AI-GENERATED]
const FEATURES = [
  { icon: 'fa-microchip', title: 'Runs on your GPU', text: 'Every slider updates live through OpenGL, even on large files.' },
  { icon: 'fa-clock-rotate-left', title: 'Nothing is lost', text: 'Edits are stored apart from the photo. Undo anything, any time.' },
  { icon: 'fa-table-columns', title: 'Before and after', text: 'Compare the original and the grade with a single click.' },
  { icon: 'fa-swatchbook', title: 'Presets', text: 'Save a look once and use it on your next shoot.' },
  { icon: 'fa-copy', title: 'Copy and paste', text: 'Grade one photo, then paste the edit onto the rest.' },
  { icon: 'fa-cube', title: '3D LUT export', text: 'Turn a grade into a .cube file other software can load.' },
];

// The About page (/about). The feed took over "/".
@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  private readonly about = viewChild.required<ElementRef<HTMLElement>>('about');

  // [AI-GENERATED]
  readonly downloadUrl = DESKTOP_DOWNLOAD_URL;
  readonly isLoggedIn = inject(TokenService).isLoggedIn;
  readonly rows = ROWS;
  readonly features = FEATURES;
  readonly shots = {
    hero: SHOT('develop-mixer.jpg'),
    band: SHOT('exposure.jpg'),
    grid: SHOT('import.jpg'),
    share: SHOT('develop.jpg'),
    filmstrip: SHOT('filmstrip.jpg'),
  };

  showAbout(): void {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.about().nativeElement.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}
