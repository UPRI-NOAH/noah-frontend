import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiverbasinComponent } from './riverbasin.component';

describe('RiverbasinComponent', () => {
  let component: RiverbasinComponent;
  let fixture: ComponentFixture<RiverbasinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiverbasinComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiverbasinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
