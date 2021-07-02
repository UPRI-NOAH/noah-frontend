import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HazardTypeComponent } from './hazard-type.component';

describe('HazardTypeComponent', () => {
  let component: HazardTypeComponent;
  let fixture: ComponentFixture<HazardTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HazardTypeComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HazardTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
