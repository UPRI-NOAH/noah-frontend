import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloodInfoComponent } from './flood-info.component';

describe('FloodInfoComponent', () => {
  let component: FloodInfoComponent;
  let fixture: ComponentFixture<FloodInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FloodInfoComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FloodInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
