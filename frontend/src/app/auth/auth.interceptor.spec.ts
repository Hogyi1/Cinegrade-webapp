import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ApiConfiguration } from '../services/api-configuration';
import { TokenService } from '../services/token/token.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let tokens: TokenService;
  let api: string;

  const unauthorized = { status: 401, statusText: 'Unauthorized' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenService);
    api = TestBed.inject(ApiConfiguration).rootUrl;
    tokens.token = 'old';
  });

  afterEach(() => backend.verify());

  it('sends the token to the API', () => {
    http.get(`${api}/posts`).subscribe();
    const req = backend.expectOne(`${api}/posts`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer old');
    req.flush({});
  });

  it('never sends the token to auth endpoints or other sites', () => {
    http.post(`${api}/auth/login`, {}).subscribe();
    http.get('https://example.com/data').subscribe();

    const login = backend.expectOne(`${api}/auth/login`);
    const other = backend.expectOne('https://example.com/data');
    expect(login.request.headers.has('Authorization')).toBeFalse();
    expect(other.request.headers.has('Authorization')).toBeFalse();
    login.flush({});
    other.flush({});
  });

  it('refreshes once when several requests fail, then retries each with the new token', () => {
    const results: unknown[] = [];
    http.get(`${api}/a`).subscribe((r) => results.push(r));
    http.get(`${api}/b`).subscribe((r) => results.push(r));

    backend.expectOne(`${api}/a`).flush(null, unauthorized);
    backend.expectOne(`${api}/b`).flush(null, unauthorized);
    backend.expectOne(`${api}/auth/refresh`).flush({ token: 'new' });

    for (const path of ['a', 'b']) {
      const retry = backend.expectOne(`${api}/${path}`);
      expect(retry.request.headers.get('Authorization')).toBe('Bearer new');
      retry.flush({ path });
    }
    expect(results.length).toBe(2);
    expect(tokens.token).toBe('new');
  });

  it('logs out and returns the original error when the refresh fails', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    let error: HttpErrorResponse | undefined;
    http.get(`${api}/posts`).subscribe({ error: (e) => (error = e) });

    backend.expectOne(`${api}/posts`).flush(null, unauthorized);
    backend.expectOne(`${api}/auth/refresh`).flush(null, unauthorized);

    expect(error?.url).toContain('/posts');
    expect(tokens.token).toBeNull();
    expect(navigate).toHaveBeenCalledOnceWith(['login']);
  });

  it('gives up without looping when the retry is also rejected', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    let status = 0;
    http.get(`${api}/posts`).subscribe({ error: (e) => (status = e.status) });

    backend.expectOne(`${api}/posts`).flush(null, unauthorized);
    backend.expectOne(`${api}/auth/refresh`).flush({ token: 'new' });
    backend.expectOne(`${api}/posts`).flush(null, unauthorized);

    expect(status).toBe(401);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not refresh on other errors', () => {
    http.get(`${api}/posts`).subscribe({ error: () => undefined });
    backend.expectOne(`${api}/posts`).flush(null, { status: 403, statusText: 'Forbidden' });
    backend.expectNone(`${api}/auth/refresh`);
  });
});
