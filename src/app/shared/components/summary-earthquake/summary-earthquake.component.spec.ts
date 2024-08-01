import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryEarthquakeComponent } from './summary-earthquake.component';

describe('SummaryEarthquakeComponent', () => {
  let component: SummaryEarthquakeComponent;
  let fixture: ComponentFixture<SummaryEarthquakeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SummaryEarthquakeComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryEarthquakeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
