import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandslideComponent } from './landslide.component';

describe('LandslideComponent', () => {
  let component: LandslideComponent;
  let fixture: ComponentFixture<LandslideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LandslideComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LandslideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
