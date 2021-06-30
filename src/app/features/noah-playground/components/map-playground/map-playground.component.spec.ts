import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapPlaygroundComponent } from './map-playground.component';

describe('MapPlaygroundComponent', () => {
  let component: MapPlaygroundComponent;
  let fixture: ComponentFixture<MapPlaygroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapPlaygroundComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MapPlaygroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
