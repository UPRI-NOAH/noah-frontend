import { TestBed } from '@angular/core/testing';

import { KyhService } from './kyh.service';

describe('KyhService', () => {
  let service: KyhService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KyhService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
