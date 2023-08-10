import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LagunaSensorSoloComponent } from './laguna-sensor-solo.component';

describe('LagunaSensorSoloComponent', () => {
  let component: LagunaSensorSoloComponent;
  let fixture: ComponentFixture<LagunaSensorSoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LagunaSensorSoloComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LagunaSensorSoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
