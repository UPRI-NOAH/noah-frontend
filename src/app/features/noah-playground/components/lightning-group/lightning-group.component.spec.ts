import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightningGroupComponent } from './lightning-group.component';

describe('LightningGroupComponent', () => {
  let component: LightningGroupComponent;
  let fixture: ComponentFixture<LightningGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LightningGroupComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LightningGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
