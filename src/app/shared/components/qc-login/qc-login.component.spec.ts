import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QcLoginComponent } from './qc-login.component';

describe('QcLoginComponent', () => {
  let component: QcLoginComponent;
  let fixture: ComponentFixture<QcLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QcLoginComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QcLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
