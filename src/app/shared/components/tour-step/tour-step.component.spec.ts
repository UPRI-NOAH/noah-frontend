import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TourStepComponent } from './tour-step.component';
import { TourStep } from '../tour/tour.models';

describe('TourStepComponent', () => {
  let component: TourStepComponent;
  let fixture: ComponentFixture<TourStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TourStepComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TourStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders text wrapped in double asterisks as bold', () => {
    component.step = {
      id: 'flood-hazard',
      title: 'Flood Hazard',
      text: 'Choose a **return period** and adjust the **opacity**.',
      target: '[data-tour-id="flood-hazard-header"]',
    } as TourStep;
    fixture.detectChanges();

    const textElement: HTMLElement =
      fixture.nativeElement.querySelector('#tour-step-text');
    const boldElements = Array.from(textElement.querySelectorAll('strong'));

    expect(textElement.textContent?.trim()).toBe(
      'Choose a return period and adjust the opacity.'
    );
    expect(boldElements.map((element) => element.textContent)).toEqual([
      'return period',
      'opacity',
    ]);
  });

  it('renders text separated by a blank line as distinct paragraphs', () => {
    component.step = {
      id: '3d-terrain',
      title: '3D Terrain',
      text: 'Turn on 3D Terrain.\n\nExpand the **dropdown** to configure it.',
    } as TourStep;
    fixture.detectChanges();

    const paragraphs: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.tour-step__paragraph')
    );

    expect(
      paragraphs.map((paragraph) => paragraph.textContent?.trim())
    ).toEqual(['Turn on 3D Terrain.', 'Expand the dropdown to configure it.']);
    expect(paragraphs[1].querySelector('strong')?.textContent).toBe('dropdown');
  });
});
