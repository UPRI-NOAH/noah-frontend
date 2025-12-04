import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TyphoonTrackGroupComponent } from './typhoon-track-group.component';

describe('TyphoonTrackGroupComponent', () => {
  let component: TyphoonTrackGroupComponent;
  let fixture: ComponentFixture<TyphoonTrackGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TyphoonTrackGroupComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TyphoonTrackGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
