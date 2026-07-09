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
    expect(component.targetHighlightStyle).toBeNull();
  }));

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
