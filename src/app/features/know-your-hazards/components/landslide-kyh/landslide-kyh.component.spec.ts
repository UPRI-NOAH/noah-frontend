import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandslideKyhComponent } from './landslide-kyh.component';

describe('LandslideKyhComponent', () => {
  let component: LandslideKyhComponent;
  let fixture: ComponentFixture<LandslideKyhComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LandslideKyhComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LandslideKyhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
