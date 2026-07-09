import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WuTemperatureGroupComponent } from './wu-temperature-group.component';

describe('WuTemperatureGroupComponent', () => {
  let component: WuTemperatureGroupComponent;
  let fixture: ComponentFixture<WuTemperatureGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WuTemperatureGroupComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WuTemperatureGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
