import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HazardLegendComponent } from './hazard-legend.component';

describe('HazardLegendComponent', () => {
  let component: HazardLegendComponent;
  let fixture: ComponentFixture<HazardLegendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HazardLegendComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HazardLegendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
