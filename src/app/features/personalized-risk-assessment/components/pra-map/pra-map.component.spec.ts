import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PraMapComponent } from './pra-map.component';

describe('PraMapComponent', () => {
  let component: PraMapComponent;
  let fixture: ComponentFixture<PraMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PraMapComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PraMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
