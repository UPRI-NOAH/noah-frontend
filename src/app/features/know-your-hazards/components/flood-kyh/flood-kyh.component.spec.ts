import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloodKyhComponent } from './flood-kyh.component';

describe('FloodKyhComponent', () => {
  let component: FloodKyhComponent;
  let fixture: ComponentFixture<FloodKyhComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FloodKyhComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FloodKyhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
