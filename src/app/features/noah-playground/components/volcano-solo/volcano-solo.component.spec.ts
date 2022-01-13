import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolcanoSoloComponent } from './volcano-solo.component';

describe('VolcanoSoloComponent', () => {
  let component: VolcanoSoloComponent;
  let fixture: ComponentFixture<VolcanoSoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VolcanoSoloComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VolcanoSoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
