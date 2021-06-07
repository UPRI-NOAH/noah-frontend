import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandslidePlaygroundComponent } from './landslide-playground.component';

describe('LandslidePlaygroundComponent', () => {
  let component: LandslidePlaygroundComponent;
  let fixture: ComponentFixture<LandslidePlaygroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LandslidePlaygroundComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LandslidePlaygroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
