import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CriticalFacilitiesComponent } from './critical-facilities.component';

describe('CriticalFacilitiesComponent', () => {
  let component: CriticalFacilitiesComponent;
  let fixture: ComponentFixture<CriticalFacilitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CriticalFacilitiesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CriticalFacilitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
