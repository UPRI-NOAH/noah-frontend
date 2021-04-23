import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PraNavComponent } from './pra-nav.component';

describe('PraNavComponent', () => {
  let component: PraNavComponent;
  let fixture: ComponentFixture<PraNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PraNavComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PraNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
