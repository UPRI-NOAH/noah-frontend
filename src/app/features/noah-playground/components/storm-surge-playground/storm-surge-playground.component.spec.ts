import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StormSurgePlaygroundComponent } from './storm-surge-playground.component';

describe('StormSurgePlaygroundComponent', () => {
  let component: StormSurgePlaygroundComponent;
  let fixture: ComponentFixture<StormSurgePlaygroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StormSurgePlaygroundComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StormSurgePlaygroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
