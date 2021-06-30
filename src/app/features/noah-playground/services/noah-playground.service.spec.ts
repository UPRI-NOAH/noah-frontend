import { TestBed } from '@angular/core/testing';

import { NoahPlaygroundService } from './noah-playground.service';

describe('NoahPlaygroundService', () => {
  let service: NoahPlaygroundService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoahPlaygroundService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
