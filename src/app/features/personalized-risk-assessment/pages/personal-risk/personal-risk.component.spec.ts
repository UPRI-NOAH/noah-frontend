import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalRiskComponent } from './personal-risk.component';

describe('PersonalRiskComponent', () => {
  let component: PersonalRiskComponent;
  let fixture: ComponentFixture<PersonalRiskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PersonalRiskComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonalRiskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
