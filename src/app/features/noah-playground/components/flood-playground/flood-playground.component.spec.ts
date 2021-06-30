import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloodPlaygroundComponent } from './flood-playground.component';

describe('FloodPlaygroundComponent', () => {
  let component: FloodPlaygroundComponent;
  let fixture: ComponentFixture<FloodPlaygroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FloodPlaygroundComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FloodPlaygroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
