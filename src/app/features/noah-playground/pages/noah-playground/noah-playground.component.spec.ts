import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoahPlaygroundComponent } from './noah-playground.component';

describe('NoahPlaygroundComponent', () => {
  let component: NoahPlaygroundComponent;
  let fixture: ComponentFixture<NoahPlaygroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NoahPlaygroundComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoahPlaygroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
