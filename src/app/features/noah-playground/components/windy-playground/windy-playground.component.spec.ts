import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WindyPlaygroundComponent } from './windy-playground.component';

describe('WindyPlaygroundComponent', () => {
  let component: WindyPlaygroundComponent;
  let fixture: ComponentFixture<WindyPlaygroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WindyPlaygroundComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WindyPlaygroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
