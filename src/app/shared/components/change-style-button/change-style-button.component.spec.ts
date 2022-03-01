import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeStyleButtonComponent } from './change-style-button.component';

describe('ChangeStyleButtonComponent', () => {
  let component: ChangeStyleButtonComponent;
  let fixture: ComponentFixture<ChangeStyleButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChangeStyleButtonComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeStyleButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
