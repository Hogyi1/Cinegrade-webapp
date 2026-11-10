import { TestBed } from '@angular/core/testing';

import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('reads the username from the token', () => {
    service.token = `x.${btoa(JSON.stringify({ username: 'someone' }))}.y`;
    expect(service.username()).toBe('someone');
  });

  it('has no username without a readable token', () => {
    expect(service.username()).toBeNull();
    service.token = 'not-a-jwt';
    expect(service.username()).toBeNull();
  });
});
