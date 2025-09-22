import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TyphoonTrackSoloComponent } from './typhoon-track-solo.component';

describe('TyphoonTrackSoloComponent', () => {
  let component: TyphoonTrackSoloComponent;
  let fixture: ComponentFixture<TyphoonTrackSoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TyphoonTrackSoloComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TyphoonTrackSoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
