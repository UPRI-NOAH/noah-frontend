import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StormSurgeComponent } from './storm-surge.component';

describe('StormSurgeComponent', () => {
  let component: StormSurgeComponent;
  let fixture: ComponentFixture<StormSurgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StormSurgeComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StormSurgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
