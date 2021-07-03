import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KnowYourHazardsComponent } from './know-your-hazards.component';

describe('KnowYourHazardsComponent', () => {
  let component: KnowYourHazardsComponent;
  let fixture: ComponentFixture<KnowYourHazardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KnowYourHazardsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KnowYourHazardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
