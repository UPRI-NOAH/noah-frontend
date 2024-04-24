import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarthquakeGroupComponent } from './earthquake-group.component';

describe('EarthquakeGroupComponent', () => {
  let component: EarthquakeGroupComponent;
  let fixture: ComponentFixture<EarthquakeGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EarthquakeGroupComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EarthquakeGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
