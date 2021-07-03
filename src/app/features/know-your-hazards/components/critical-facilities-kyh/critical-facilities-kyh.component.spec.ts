import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CriticalFacilitiesKyhComponent } from './critical-facilities-kyh.component';

describe('CriticalFacilitiesKyhComponent', () => {
  let component: CriticalFacilitiesKyhComponent;
  let fixture: ComponentFixture<CriticalFacilitiesKyhComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CriticalFacilitiesKyhComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CriticalFacilitiesKyhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
