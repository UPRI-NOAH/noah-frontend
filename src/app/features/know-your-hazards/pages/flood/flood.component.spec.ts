import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloodComponent } from './flood.component';

describe('FloodComponent', () => {
  let component: FloodComponent;
  let fixture: ComponentFixture<FloodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FloodComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FloodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
