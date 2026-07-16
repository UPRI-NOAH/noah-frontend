import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

import { TourComponent } from './tour.component';
import { SharedModule } from '../../shared.module';
import { TourDefinition } from './tour.models';

describe('TourComponent', () => {
  let component: TourComponent;
  let fixture: ComponentFixture<TourComponent>;
  let overlayContainer: OverlayContainer;

  const stylesContainPoint = (
    styles: Record<string, string>[],
    x: number,
    y: number
  ): boolean =>
    styles.some((style) => {
      if (style.inset === '0') {
        return true;
      }

      const left = Number.parseFloat(style.left || '0');
      const top = Number.parseFloat(style.top || '0');
      const width = Number.parseFloat(style.width || '0');
      const height = Number.parseFloat(style.height || '0');

      return x >= left && x < left + width && y >= top && y < top + height;
    });

  const definition: TourDefinition = {
    id: 'test-tour',
    title: 'Test Tour',
    welcome: {
      title: 'Welcome',
      text: 'Welcome text',
    },
    sections: [
      {
        id: 'first',
        label: 'First',
        steps: [
          {
            id: 'first-step',
            title: 'First step',
            text: 'First step text',
            target: '[data-missing-tour-target]',
          },
          {
            id: 'second-step',
            title: 'Second step',
            text: 'Second step text',
          },
        ],
      },
      {
        id: 'last',
        label: 'Last',
        steps: [
          {
            id: 'last-step',
            title: 'Last step',
            text: 'Last step text',
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
    }).compileComponents();
  });

  beforeEach(() => {
    overlayContainer = TestBed.inject(OverlayContainer);
    fixture = TestBed.createComponent(TourComponent);
    component = fixture.componentInstance;
    component.definition = definition;
    component.ngOnChanges({
      definition: new SimpleChange(null, definition, true),
    });
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    overlayContainer.getContainerElement().innerHTML = '';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens the welcome modal from the help button', () => {
    const helpButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Help"]'
    );

    helpButton.click();
    fixture.detectChanges();

    expect(component.phase).toBe('welcome');
    expect(
      overlayContainer.getContainerElement().querySelector('noah-tour-welcome')
    ).not.toBeNull();
  });

  it('renders tour content in the document-level overlay container', () => {
    component.openWelcome();
    fixture.detectChanges();

    expect(
      overlayContainer.getContainerElement().querySelector('.tour-layer')
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.tour-layer')).toBeNull();
  });

  it('keeps the CDK overlay pane click-through', () => {
    component.openWelcome();
    fixture.detectChanges();

    const pane = overlayContainer
      .getContainerElement()
      .querySelector<HTMLElement>('.noah-tour-overlay-pane');

    expect(pane?.style.pointerEvents).toBe('none');
  });

  it('emits the configured start event only when the tour starts', fakeAsync(() => {
    definition.startEvent = 'test-tour-start';
    const dispatchEventSpy = spyOn(window, 'dispatchEvent').and.callThrough();

    component.openWelcome();
    fixture.detectChanges();

    expect(dispatchEventSpy).not.toHaveBeenCalled();

    component.startTour();
    tick(16);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({ type: 'test-tour-start' })
    );

    delete definition.startEvent;
  }));

  it('starts at the first step and advances across sections', fakeAsync(() => {
    component.openWelcome();
    component.startTour();
    tick(16);
    fixture.detectChanges();

    expect(component.currentFlatStep?.step.title).toBe('First step');
    expect(component.activeSectionId).toBe('first');

    component.showNextStep();
    tick(16);
    component.showNextStep();
    tick(16);
    fixture.detectChanges();

    expect(component.currentFlatStep?.step.title).toBe('Last step');
    expect(component.activeSectionId).toBe('last');
  }));

  it('emits the configured event when Next is clicked', fakeAsync(() => {
    const firstStep = definition.sections[0].steps[0];
    firstStep.nextEvent = 'test-tour-next';
    const dispatchEventSpy = spyOn(window, 'dispatchEvent').and.callThrough();

    component.startTour();
    tick(16);
    component.showNextStep();

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({ type: 'test-tour-next' })
    );

    delete firstStep.nextEvent;
  }));

  it('does not emit the manual Next event when auto-advancing', fakeAsync(() => {
    const firstStep = definition.sections[0].steps[0];
    firstStep.nextEvent = 'test-tour-next';
    firstStep.advanceOnEvent = 'test-tour-auto-advance';
    const dispatchEventSpy = spyOn(window, 'dispatchEvent').and.callThrough();

    component.startTour();
    tick(16);
    component.handleTourAdvanceEvent(new Event('test-tour-auto-advance'));

    expect(component.currentStepIndex).toBe(1);
    expect(dispatchEventSpy).not.toHaveBeenCalled();

    delete firstStep.nextEvent;
    delete firstStep.advanceOnEvent;
  }));

  it('jumps to the first step of a selected section', fakeAsync(() => {
    component.startTour();
    tick(16);

    component.selectSection('last');
    tick(16);
    fixture.detectChanges();

    expect(component.currentStepIndex).toBe(2);
    expect(component.currentFlatStep?.step.id).toBe('last-step');
    expect(component.activeSectionId).toBe('last');
  }));

  it('centers the panel when a target cannot be found', fakeAsync(() => {
    component.startTour();
    tick(16);
    fixture.detectChanges();

    expect(component.stepPanelStyle.left).toBe('50%');
    expect(component.stepPanelStyle.top).toBe('50%');
    expect(component.targetHighlightStyles).toEqual([]);
  }));

  it('positions corner placements inside the target bounds', () => {
    const position = (component as any).positionForPlacement(
      'bottom-right',
      new DOMRect(0, 0, 1022, 1024),
      587,
      295,
      16,
      1440,
      1024,
      16
    );

    expect(position.left).toBe(419);
    expect(position.top).toBe(713);
  });

  it('keeps the gap between separate targets dimmed and blocked', () => {
    const targetRects = [
      new DOMRect(100, 100, 100, 40),
      new DOMRect(300, 100, 100, 40),
    ];
    const maskStyles = (component as any).stylesOutsideRects(
      targetRects,
      1000,
      800
    );

    expect(stylesContainPoint(maskStyles, 250, 120)).toBe(true);
    expect(stylesContainPoint(maskStyles, 150, 120)).toBe(false);
    expect(stylesContainPoint(maskStyles, 350, 120)).toBe(false);
  });

  it('keeps only the expanded active card highlighted and interactive', () => {
    const headerRect = new DOMRect(100, 100, 100, 40);
    const expandedCardRect = new DOMRect(100, 100, 100, 400);
    const activeRects = [headerRect, expandedCardRect];
    const maskStyles = (component as any).stylesOutsideRects(
      activeRects,
      1000,
      800
    );
    const blockerStyles = (component as any).stylesOutsideRects(
      activeRects,
      1000,
      800
    );

    expect(stylesContainPoint(maskStyles, 150, 350)).toBe(false);
    expect(stylesContainPoint(blockerStyles, 150, 350)).toBe(false);
    expect(stylesContainPoint(maskStyles, 150, 550)).toBe(true);
    expect(stylesContainPoint(blockerStyles, 150, 550)).toBe(true);
  });

  it('resets the current step when closed and reopened', fakeAsync(() => {
    component.startTour();
    tick(16);
    component.showNextStep();
    tick(16);

    component.closeTour();
    component.openWelcome();
    fixture.detectChanges();

    expect(component.phase).toBe('welcome');
    expect(component.currentStepIndex).toBe(0);
  }));

  it('removes the overlay pane when the tour closes', () => {
    component.openWelcome();
    fixture.detectChanges();

    component.closeTour();
    fixture.detectChanges();

    expect(
      overlayContainer
        .getContainerElement()
        .querySelector('.noah-tour-overlay-pane')
    ).toBeNull();
  });
});
