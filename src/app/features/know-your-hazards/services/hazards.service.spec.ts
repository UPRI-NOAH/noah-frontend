import { TestBed } from '@angular/core/testing';

import { HazardsService } from './hazards.service';

describe('HazardsService', () => {
  let service: HazardsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HazardsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
