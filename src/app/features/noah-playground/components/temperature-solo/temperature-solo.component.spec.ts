import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemperatureSoloComponent } from './temperature-solo.component';

describe('TemperatureSoloComponent', () => {
  let component: TemperatureSoloComponent;
  let fixture: ComponentFixture<TemperatureSoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TemperatureSoloComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TemperatureSoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
