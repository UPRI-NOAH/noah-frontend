import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HazardButtonComponent } from './hazard-button.component';

describe('HazardButtonComponent', () => {
  let component: HazardButtonComponent;
  let fixture: ComponentFixture<HazardButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HazardButtonComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HazardButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
