import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WindSoloComponent } from './wind-solo.component';

describe('WindSoloComponent', () => {
  let component: WindSoloComponent;
  let fixture: ComponentFixture<WindSoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WindSoloComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WindSoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
