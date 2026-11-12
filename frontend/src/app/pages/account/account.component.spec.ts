import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TokenService } from '../../services/token/token.service';
import { AccountComponent } from './account.component';

const tokenFor = (username: string) => `x.${btoa(JSON.stringify({ username }))}.y`;

describe('AccountComponent', () => {
  let component: AccountComponent;
  let fixture: ComponentFixture<AccountComponent>;
  let http: HttpTestingController;

  const pick = (name: string, type: string, size = 10) => {
    const file = new File([new Uint8Array(size)], name, { type });
    component.onPhotoPicked({ target: { files: [file], value: name } } as unknown as Event);
  };

  // [AI-GENERATED]
  const answerProfile = (body: object = {}) =>
    http.expectOne((r) => r.method === 'GET' && r.url.endsWith('/users/me')).flush(body);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AccountComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(TokenService).token = tokenFor('someone');
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('starts with the current username and nothing to save', () => {
    answerProfile();
    expect(component.username()).toBe('someone');
    expect(component.usernameChanged()).toBeFalse();
  });

  it('lowercases the username and checks the rule', () => {
    answerProfile();
    component.onUsernameChange('New_Name');
    expect(component.username()).toBe('new_name');
    expect(component.usernameError()).toBe('');

    component.onUsernameChange('no');
    expect(component.usernameError()).not.toBe('');
  });

  it('accepts images and shows a preview', () => {
    answerProfile();
    pick('me.png', 'image/png');
    expect(component.photo()?.name).toBe('me.png');
    expect(component.photoPreview()).toContain('blob:');
    expect(component.photoError()).toBe('');
  });

  it('rejects other file types and files over 5 MB', () => {
    answerProfile();
    pick('me.gif', 'image/gif');
    expect(component.photoError()).toContain('JPG');

    // [AI-GENERATED] The backend can't read WebP, so the page turns it away first.
    pick('me.webp', 'image/webp');
    expect(component.photoError()).toContain('JPG');

    pick('huge.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1);
    expect(component.photoError()).toContain('5 MB');
    expect(component.photo()).toBeNull();
  });

  // [AI-GENERATED]
  it('loads the saved description, picture and username cooldown', () => {
    const later = new Date(Date.now() + 86_400_000).toISOString();
    answerProfile({ description: 'hello', avatarFileId: 7, nextUsernameChangeAt: later });

    expect(component.description()).toBe('hello');
    expect(component.avatarUrl()).toMatch(/\/files\/7$/);
    expect(component.usernameLockedUntil()).not.toBeNull();
  });

  // [AI-GENERATED]
  it('shows an error when the profile does not load', () => {
    http.expectOne((r) => r.url.endsWith('/users/me')).flush(null, { status: 500, statusText: 'Error' });
    expect(component.loadErrors().length).toBe(1);
  });

  // [AI-GENERATED]
  it('saves the description', () => {
    answerProfile();
    component.onDescriptionChange('new text');
    component.saveDescription();
    expect(component.descriptionStatus()).toBe('saving');

    const req = http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/users/me/description'));
    expect(req.request.body).toEqual({ description: 'new text' });
    req.flush({ description: 'new text' });
    expect(component.descriptionStatus()).toBe('saved');
  });

  // [AI-GENERATED]
  it('stores the new token after a username change', () => {
    answerProfile();
    component.onUsernameChange('new_name');
    component.saveUsername();

    http.expectOne((r) => r.method === 'PUT' && r.url.endsWith('/users/me/username')).flush({ token: tokenFor('new_name') });
    expect(component.currentUsername()).toBe('new_name');
    expect(component.usernameStatus()).toBe('saved');
    answerProfile(); // the cooldown reload
  });

  // [AI-GENERATED]
  it('explains a taken username', () => {
    answerProfile();
    component.onUsernameChange('taken_name');
    component.saveUsername();

    http
      .expectOne((r) => r.url.endsWith('/users/me/username'))
      .flush({ businessErrorCode: 305 }, { status: 409, statusText: 'Conflict' });
    expect(component.usernameErrors()[0]).toContain('already has');
    expect(component.usernameStatus()).toBe('idle');
  });

  // [AI-GENERATED]
  it('uploads the picked photo as multipart', () => {
    answerProfile();
    pick('me.png', 'image/png');
    component.savePhoto();

    const req = http.expectOne((r) => r.method === 'PUT' && r.url.endsWith('/users/me/avatar'));
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush({ avatarFileId: 9 });
    expect(component.avatarUrl()).toMatch(/\/files\/9$/);
    expect(component.photoPreview()).toBeNull();
    expect(component.photoStatus()).toBe('saved');
  });
});
