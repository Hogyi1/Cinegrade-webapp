import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, convertToParamMap, provideRouter, ActivatedRoute } from '@angular/router';

import { ActivateAccountComponent } from './activate-account.component';

describe('ActivateAccountComponent', () => {
  let component: ActivateAccountComponent;
  let fixture: ComponentFixture<ActivateAccountComponent>;

  const setup = (query: Record<string, string> = {}) => {
    TestBed.configureTestingModule({
      imports: [ActivateAccountComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    });
    fixture = TestBed.createComponent(ActivateAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  const failWith = (status: number, error: unknown) =>
    component.onActivateError(new HttpErrorResponse({ status, error }));

  it('fills the form from the email link', () => {
    setup({ email: 'a+b@example.com', code: '123456' });
    expect(component.email()).toBe('a+b@example.com');
    expect(component.code()).toBe('123456');
  });

  it('asks for both fields when opened without a link', () => {
    setup();
    component.submit();
    expect(component.emailError()).not.toBe('');
    expect(component.codeError()).not.toBe('');
  });

  it('keeps only digits in the code', () => {
    setup();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#code');
    input.value = '12a 34-5678';
    input.dispatchEvent(new Event('input'));

    expect(component.code()).toBe('123456');
    expect(input.value).toBe('123456');
  });

  it('needs only the email to send a new code', () => {
    setup();
    component.resend();
    expect(component.emailError()).not.toBe('');
    expect(component.codeError()).toBe('');
  });

  it('sends the user to sign in after activation', () => {
    setup({ email: 'name@example.com' });
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    component.onActivated();
    expect(navigate).toHaveBeenCalledOnceWith(['login'], {
      state: { activated: true, login: 'name@example.com' },
    });
  });

  it('clears the code when it can no longer be used', () => {
    setup({ code: '123456' });
    failWith(400, { businessErrorCode: 309 });
    expect(component.code()).toBe('');
    expect(component.errorMsg()[0]).toContain('new code');
  });

  it('shows the server message for a wrong code and keeps the digits', () => {
    setup({ code: '123456' });
    failWith(400, { businessErrorCode: 307, businessErrorDescription: 'That activation code is not valid' });
    expect(component.errorMsg()).toEqual(['That activation code is not valid']);
    expect(component.code()).toBe('123456');
  });

  it('reads a server error that arrives as text', () => {
    setup();
    failWith(400, JSON.stringify({ businessErrorCode: 307, businessErrorDescription: 'That activation code is not valid' }));
    expect(component.errorMsg()).toEqual(['That activation code is not valid']);
  });

  it('explains an unreachable server', () => {
    setup();
    failWith(0, null);
    expect(component.errorMsg()[0]).toContain('reach');
  });
});
