import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoundariesSoloComponent } from './boundaries-solo.component';

describe('BoundariesSoloComponent', () => {
  let component: BoundariesSoloComponent;
  let fixture: ComponentFixture<BoundariesSoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BoundariesSoloComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BoundariesSoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
