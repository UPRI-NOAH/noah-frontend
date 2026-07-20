import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WindGroupComponent } from './wind-group.component';

describe('WindGroupComponent', () => {
  let component: WindGroupComponent;
  let fixture: ComponentFixture<WindGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WindGroupComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WindGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
