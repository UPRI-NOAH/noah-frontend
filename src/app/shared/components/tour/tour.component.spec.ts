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

  it('shifts a left-positioned panel away from a visible overlapping target', () => {
    const position = (component as any).positionToAvoidTargets(
      { left: 500, top: 100 },
      'left',
      300,
      200,
      [new DOMRect(650, 150, 100, 40)],
      16
    );

    expect(position).toEqual({ left: 334, top: 100 });
  });

  it('keeps a left-positioned panel anchored without visible avoid targets', () => {
    const position = (component as any).positionToAvoidTargets(
      { left: 500, top: 100 },
      'left',
      300,
      200,
      [],
      16
    );

    expect(position).toEqual({ left: 500, top: 100 });
  });

  it('places a mobile panel below a target near the top of the viewport', () => {
    const target = new DOMRect(12, 40, 366, 48);
    const position = (component as any).positionForMobile(
      target,
      target,
      'right',
      366,
      300,
      390,
      844,
      []
    );

    expect(position).toEqual({ left: 12, top: 100, maxHeight: 300 });
  });

  it('anchors a mobile panel to its container while allowing it to grow above', () => {
    const position = (component as any).positionInMobileContainer(
      new DOMRect(0, 588, 390, 256),
      366,
      400,
      390,
      844
    );

    expect(position).toEqual({ left: 12, top: 432, maxHeight: 400 });
  });

  it('only constrains a sidebar panel when it is taller than the viewport', () => {
    const position = (component as any).positionInMobileContainer(
      new DOMRect(0, 588, 390, 256),
      366,
      900,
      390,
      844
    );

    expect(position).toEqual({ left: 12, top: 12, maxHeight: 820 });
  });

  it('places a mobile panel above a target near the bottom of the viewport', () => {
    const target = new DOMRect(12, 700, 366, 80);
    const position = (component as any).positionForMobile(
      target,
      target,
      'right',
      366,
      300,
      390,
      844,
      []
    );

    expect(position).toEqual({ left: 12, top: 388, maxHeight: 300 });
  });

  it('treats multiple mobile spotlight targets as one protected area', () => {
    const protectedRect = (component as any).boundingRect([
      new DOMRect(12, 40, 366, 48),
      new DOMRect(12, 88, 366, 180),
    ]);
    const position = (component as any).positionForMobile(
      protectedRect,
      new DOMRect(12, 40, 366, 48),
      'right',
      366,
      300,
      390,
      844,
      []
    );

    expect(protectedRect.left).toBe(12);
    expect(protectedRect.top).toBe(40);
    expect(protectedRect.width).toBe(366);
    expect(protectedRect.height).toBe(228);
    expect(position.top).toBe(280);
  });

  it('constrains a long mobile panel to the usable space above its target', () => {
    const target = new DOMRect(12, 300, 366, 40);
    const position = (component as any).positionForMobile(
      target,
      target,
      'right',
      366,
      400,
      390,
      568,
      []
    );

    expect(position).toEqual({ left: 12, top: 12, maxHeight: 276 });
  });

  it('avoids visible mobile panel collision targets when choosing a side', () => {
    const target = new DOMRect(12, 380, 366, 40);
    const position = (component as any).positionForMobile(
      target,
      target,
      'bottom',
      366,
      300,
      390,
      844,
      [new DOMRect(0, 420, 390, 424)]
    );

    expect(position).toEqual({ left: 12, top: 68, maxHeight: 300 });
  });

  it('falls back to a clamped placement for a full-screen mobile target', () => {
    const target = new DOMRect(0, 0, 390, 844);
    const position = (component as any).positionForMobile(
      target,
      target,
      'bottom-right',
      366,
      400,
      390,
      844,
      []
    );

    expect(position).toEqual({ left: 12, top: 432, maxHeight: 400 });
  });

  it('uses the application mobile breakpoint for responsive placement', () => {
    expect((component as any).isMobileViewport(767)).toBe(true);
    expect((component as any).isMobileViewport(768)).toBe(false);
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

  it('clips a highlighted target to its scrolling sidebar bounds', () => {
    const sidebar = document.createElement('div');
    const target = document.createElement('div');
    sidebar.style.overflowY = 'auto';
    sidebar.appendChild(target);
    document.body.appendChild(sidebar);
    spyOn(sidebar, 'getBoundingClientRect').and.returnValue(
      new DOMRect(0, 500, 390, 300)
    );
    spyOn(target, 'getBoundingClientRect').and.returnValue(
      new DOMRect(16, 740, 350, 160)
    );

    const visibleRect = (component as any).visibleRectForTarget(
      target,
      390,
      844,
      { top: 4, right: 4, bottom: 4, left: 4 }
    );

    expect(visibleRect.left).toBe(12);
    expect(visibleRect.top).toBe(736);
    expect(visibleRect.right).toBe(370);
    expect(visibleRect.bottom).toBe(800);

    sidebar.remove();
  });

  it('recognizes highlighted targets inside a scrolling sidebar', () => {
    const sidebar = document.createElement('div');
    const target = document.createElement('div');
    sidebar.style.overflowY = 'auto';
    sidebar.appendChild(target);
    document.body.appendChild(sidebar);

    expect((component as any).hasClippingAncestor(target)).toBe(true);

    sidebar.remove();
  });

  it('restores only the intended highlight when it is scrolled out of the sidebar', fakeAsync(() => {
    const sidebar = document.createElement('div');
    const target = document.createElement('div');
    let targetRect = new DOMRect(16, 740, 350, 40);
    sidebar.style.overflowY = 'auto';
    target.setAttribute('data-missing-tour-target', '');
    sidebar.appendChild(target);
    document.body.appendChild(sidebar);
    spyOn(sidebar, 'getBoundingClientRect').and.returnValue(
      new DOMRect(0, 500, 390, 300)
    );
    spyOn(target, 'getBoundingClientRect').and.callFake(() => targetRect);
    const scrollIntoViewSpy = spyOn(target, 'scrollIntoView').and.callFake(
      (options?: boolean | ScrollIntoViewOptions) => {
        if (typeof options === 'object' && options.block === 'nearest') {
          targetRect = new DOMRect(16, 740, 350, 40);
        }
      }
    );

    component.startTour();
    tick(16);
    targetRect = new DOMRect(16, 850, 350, 40);
    component.repositionCurrentStep();

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });
    expect(component.targetHighlightStyles).toEqual([
      jasmine.objectContaining({
        left: '12px',
        top: '736px',
        width: '358px',
        height: '48px',
      }),
    ]);

    sidebar.remove();
  }));

  it('observes the app shell for sibling targets being removed or restored', () => {
    const appRoot = document.createElement('noah-root');
    const target = document.createElement('div');
    appRoot.appendChild(target);
    document.body.appendChild(appRoot);

    (component as any).observeTargets(target, [target]);

    expect((component as any).observedMutationRoot).toBe(appRoot);

    (component as any).disconnectTargetObservers();
    appRoot.remove();
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
