import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WuTemperatureSoloComponent } from './wu-temperature-solo.component';

describe('WuTemperatureSoloComponent', () => {
  let component: WuTemperatureSoloComponent;
  let fixture: ComponentFixture<WuTemperatureSoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WuTemperatureSoloComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WuTemperatureSoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
