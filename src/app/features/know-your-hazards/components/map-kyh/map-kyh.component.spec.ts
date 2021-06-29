import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapKyhComponent } from './map-kyh.component';

describe('MapKyhComponent', () => {
  let component: MapKyhComponent;
  let fixture: ComponentFixture<MapKyhComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapKyhComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MapKyhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
