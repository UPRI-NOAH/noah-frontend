import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarthquakeSoloComponent } from './earthquake-solo.component';

describe('EarthquakeSoloComponent', () => {
  let component: EarthquakeSoloComponent;
  let fixture: ComponentFixture<EarthquakeSoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EarthquakeSoloComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EarthquakeSoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
