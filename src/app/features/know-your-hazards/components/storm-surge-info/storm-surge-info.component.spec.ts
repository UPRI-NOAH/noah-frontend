import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StormSurgeInfoComponent } from './storm-surge-info.component';

describe('StormSurgeInfoComponent', () => {
  let component: StormSurgeInfoComponent;
  let fixture: ComponentFixture<StormSurgeInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StormSurgeInfoComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StormSurgeInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
