import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CriticalFacilitiesPlaygroundComponent } from './critical-facilities-playground.component';

describe('CriticalFacilitiesPlaygroundComponent', () => {
  let component: CriticalFacilitiesPlaygroundComponent;
  let fixture: ComponentFixture<CriticalFacilitiesPlaygroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CriticalFacilitiesPlaygroundComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CriticalFacilitiesPlaygroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
