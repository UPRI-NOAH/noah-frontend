import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolcanoGroupComponent } from './volcano-group.component';

describe('VolcanoGroupComponent', () => {
  let component: VolcanoGroupComponent;
  let fixture: ComponentFixture<VolcanoGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VolcanoGroupComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VolcanoGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
