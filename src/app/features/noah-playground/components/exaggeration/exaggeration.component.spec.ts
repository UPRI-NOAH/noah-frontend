import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExaggerationComponent } from './exaggeration.component';

describe('ExaggerationComponent', () => {
  let component: ExaggerationComponent;
  let fixture: ComponentFixture<ExaggerationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExaggerationComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExaggerationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
