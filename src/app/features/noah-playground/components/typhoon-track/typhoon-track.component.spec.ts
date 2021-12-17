import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TyphoonTrackComponent } from './typhoon-track.component';

describe('TyphoonTrackComponent', () => {
  let component: TyphoonTrackComponent;
  let fixture: ComponentFixture<TyphoonTrackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TyphoonTrackComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TyphoonTrackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
