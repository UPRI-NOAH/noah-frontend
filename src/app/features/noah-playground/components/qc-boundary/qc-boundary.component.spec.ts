import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QcBoundaryComponent } from './qc-boundary.component';

describe('QcBoundaryComponent', () => {
  let component: QcBoundaryComponent;
  let fixture: ComponentFixture<QcBoundaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QcBoundaryComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QcBoundaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
