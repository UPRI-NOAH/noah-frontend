import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurvivalKitComponent } from './survival-kit.component';

describe('SurvivalKitComponent', () => {
  let component: SurvivalKitComponent;
  let fixture: ComponentFixture<SurvivalKitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SurvivalKitComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SurvivalKitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
