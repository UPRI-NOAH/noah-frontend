import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RainfallContourButtonComponent } from './rainfall-contour-button.component';

describe('RainfallContourButtonComponent', () => {
  let component: RainfallContourButtonComponent;
  let fixture: ComponentFixture<RainfallContourButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RainfallContourButtonComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RainfallContourButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
