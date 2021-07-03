import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandslideInfoComponent } from './landslide-info.component';

describe('LandslideInfoComponent', () => {
  let component: LandslideInfoComponent;
  let fixture: ComponentFixture<LandslideInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LandslideInfoComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LandslideInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
