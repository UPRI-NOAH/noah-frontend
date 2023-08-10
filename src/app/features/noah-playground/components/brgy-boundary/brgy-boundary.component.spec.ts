import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrgyBoundaryComponent } from './brgy-boundary.component';

describe('BrgyBoundaryComponent', () => {
  let component: BrgyBoundaryComponent;
  let fixture: ComponentFixture<BrgyBoundaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BrgyBoundaryComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BrgyBoundaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
