import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContourMapsComponent } from './contour-maps.component';

describe('ContourMapsComponent', () => {
  let component: ContourMapsComponent;
  let fixture: ComponentFixture<ContourMapsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContourMapsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContourMapsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
