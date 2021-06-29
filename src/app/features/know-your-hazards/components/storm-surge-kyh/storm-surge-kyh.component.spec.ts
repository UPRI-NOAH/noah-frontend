import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StormSurgeKyhComponent } from './storm-surge-kyh.component';

describe('StormSurgeKyhComponent', () => {
  let component: StormSurgeKyhComponent;
  let fixture: ComponentFixture<StormSurgeKyhComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StormSurgeKyhComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StormSurgeKyhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
