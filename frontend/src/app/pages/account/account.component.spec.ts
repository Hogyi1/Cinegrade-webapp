import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TokenService } from '../../services/token/token.service';
import { AccountComponent } from './account.component';

describe('AccountComponent', () => {
  let component: AccountComponent;
  let fixture: ComponentFixture<AccountComponent>;

  const pick = (name: string, type: string, size = 10) => {
    const file = new File([new Uint8Array(size)], name, { type });
    component.onPhotoPicked({ target: { files: [file], value: name } } as unknown as Event);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AccountComponent] });
    TestBed.inject(TokenService).token = `x.${btoa(JSON.stringify({ username: 'someone' }))}.y`;
    fixture = TestBed.createComponent(AccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts with the current username and nothing to save', () => {
    expect(component.username()).toBe('someone');
    expect(component.usernameChanged()).toBeFalse();
  });

  it('lowercases the username and checks the rule', () => {
    component.onUsernameChange('New_Name');
    expect(component.username()).toBe('new_name');
    expect(component.usernameError()).toBe('');

    component.onUsernameChange('no');
    expect(component.usernameError()).not.toBe('');
  });

  it('says plainly that a username change was not saved', () => {
    component.saveUsername();
    expect(component.notSaved()).toBeNull();

    component.onUsernameChange('new_name');
    component.saveUsername();
    expect(component.notSaved()).toBe('username');
  });

  it('accepts images and shows a preview', () => {
    pick('me.png', 'image/png');
    expect(component.photo()?.name).toBe('me.png');
    expect(component.photoPreview()).toContain('blob:');
    expect(component.photoError()).toBe('');
  });

  it('rejects other file types and files over 5 MB', () => {
    pick('me.gif', 'image/gif');
    expect(component.photoError()).toContain('JPG');

    pick('huge.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1);
    expect(component.photoError()).toContain('5 MB');
    expect(component.photo()).toBeNull();
  });
});
