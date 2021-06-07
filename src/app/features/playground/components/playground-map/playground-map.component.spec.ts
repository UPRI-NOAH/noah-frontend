import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaygroundMapComponent } from './playground-map.component';

describe('PlaygroundMapComponent', () => {
  let component: PlaygroundMapComponent;
  let fixture: ComponentFixture<PlaygroundMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlaygroundMapComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaygroundMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
