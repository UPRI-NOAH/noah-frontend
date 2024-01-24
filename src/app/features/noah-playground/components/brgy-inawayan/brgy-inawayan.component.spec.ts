import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrgyInawayanComponent } from './brgy-inawayan.component';

describe('BrgyInawayanComponent', () => {
  let component: BrgyInawayanComponent;
  let fixture: ComponentFixture<BrgyInawayanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BrgyInawayanComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BrgyInawayanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
