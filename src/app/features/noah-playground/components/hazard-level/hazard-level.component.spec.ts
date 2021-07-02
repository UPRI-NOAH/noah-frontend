import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HazardLevelComponent } from './hazard-level.component';

describe('HazardLevelComponent', () => {
  let component: HazardLevelComponent;
  let fixture: ComponentFixture<HazardLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HazardLevelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HazardLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
