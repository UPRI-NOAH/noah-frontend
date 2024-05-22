import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoundariesGroupComponent } from './boundaries-group.component';

describe('BoundariesGroupComponent', () => {
  let component: BoundariesGroupComponent;
  let fixture: ComponentFixture<BoundariesGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BoundariesGroupComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BoundariesGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
