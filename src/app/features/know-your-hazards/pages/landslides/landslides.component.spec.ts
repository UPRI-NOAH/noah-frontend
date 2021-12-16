import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandslidesComponent } from './landslides.component';

describe('LandslidesComponent', () => {
  let component: LandslidesComponent;
  let fixture: ComponentFixture<LandslidesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LandslidesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LandslidesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
