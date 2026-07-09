import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { CdkPortal } from '@angular/cdk/portal';
import {
  FlatTourStep,
  TourDefinition,
  TourPlacement,
  TourSection,
} from './tour.models';
import { TourStepComponent } from '../tour-step/tour-step.component';

type TourPhase = 'closed' | 'welcome' | 'tour';
type TourPositionStyle = Record<string, string>;

@Component({
  selector: 'noah-tour',
  templateUrl: './tour.component.html',
  styleUrls: ['./tour.component.scss'],
})
export class TourComponent implements OnChanges, OnDestroy {
  @Input() definition: TourDefinition | null = null;

  @ViewChild(CdkPortal, { static: true }) tourPortal!: CdkPortal;
  @ViewChild('stepPanel') stepPanel?: ElementRef<HTMLElement>;
  @ViewChild(TourStepComponent) stepComponent?: TourStepComponent;

  phase: TourPhase = 'closed';
  currentStepIndex = 0;
  flatSteps: FlatTourStep[] = [];
  stepPanelStyle: TourPositionStyle = {};
  targetHighlightStyle: TourPositionStyle | null = null;
  targetDimStyle: TourPositionStyle | null = null;
  interactionBlockerStyles: TourPositionStyle[] = [];

  private overlayRef: OverlayRef | null = null;
  private targetMutationObserver: MutationObserver | null = null;
  private targetResizeObserver: ResizeObserver | null = null;
  private observedMutationRoot: HTMLElement | null = null;
  private observedResizeTargets: HTMLElement[] = [];
  private repositionFrameId: number | null = null;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private changeDetectorRef: ChangeDetectorRef,
    private overlay: Overlay
  ) {}

  get currentFlatStep(): FlatTourStep | null {
    return this.flatSteps[this.currentStepIndex] || null;
  }

  get activeSectionId(): string | null {
    return this.currentFlatStep?.sectionId || null;
  }

  get hasPrevious(): boolean {
    return this.currentStepIndex > 0;
  }

  get hasNext(): boolean {
    return this.currentStepIndex < this.flatSteps.length - 1;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.definition) {
      this.flatSteps = this.flattenSteps(this.definition?.sections || []);
      this.closeTour();
    }
  }

  ngOnDestroy(): void {
    this.disconnectTargetObservers();
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }

  openWelcome(): void {
    if (!this.definition || this.flatSteps.length === 0) {
      return;
    }

    this.currentStepIndex = 0;
    this.phase = 'welcome';
    this.attachOverlay();
  }

  startTour(): void {
    if (this.flatSteps.length === 0) {
      return;
    }

    const startEvent = this.definition?.startEvent;
    if (startEvent) {
      this.document.defaultView?.dispatchEvent(new Event(startEvent));
    }

    this.currentStepIndex = 0;
    this.phase = 'tour';
    this.attachOverlay();
    this.renderCurrentStep();
  }

  closeTour(): void {
    this.disconnectTargetObservers();
    this.phase = 'closed';
    this.currentStepIndex = 0;
    this.stepPanelStyle = {};
    this.targetHighlightStyle = null;
    this.targetDimStyle = null;
    this.interactionBlockerStyles = [];
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }

  showPreviousStep(): void {
    if (!this.hasPrevious) {
      return;
    }

    this.currentStepIndex -= 1;
    this.renderCurrentStep();
  }

  showNextStep(emitNextEvent = true): void {
    if (!this.hasNext) {
      return;
    }

    const nextEvent = this.currentFlatStep?.step.nextEvent;
    if (emitNextEvent && nextEvent) {
      this.document.defaultView?.dispatchEvent(new Event(nextEvent));
    }

    this.currentStepIndex += 1;
    this.renderCurrentStep();
  }

  selectSection(sectionId: string): void {
    const stepIndex = this.flatSteps.findIndex(
      (flatStep) => flatStep.sectionId === sectionId
    );

    if (stepIndex === -1) {
      return;
    }

    this.currentStepIndex = stepIndex;
    this.renderCurrentStep();
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  repositionCurrentStep(): void {
    if (this.phase === 'tour') {
      this.positionCurrentStep();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.phase !== 'closed') {
      this.closeTour();
    }
  }

  @HostListener('window:noah-tour-location-selected', ['$event'])
  handleTourAdvanceEvent(event: Event): void {
    if (
      this.phase === 'tour' &&
      this.currentFlatStep?.step.advanceOnEvent === event.type
    ) {
      this.showNextStep(false);
    }
  }

  private flattenSteps(sections: TourSection[]): FlatTourStep[] {
    return sections.reduce<FlatTourStep[]>((steps, section) => {
      const sectionSteps = section.steps.map((step) => ({
        sectionId: section.id,
        step,
      }));

      return [...steps, ...sectionSteps];
    }, []);
  }

  private attachOverlay(): void {
    if (!this.overlayRef) {
      this.overlayRef = this.overlay.create({
        positionStrategy: this.overlay.position().global().top('0').left('0'),
        scrollStrategy: this.overlay.scrollStrategies.noop(),
        panelClass: 'noah-tour-overlay-pane',
      });
      this.overlayRef.overlayElement.style.pointerEvents = 'none';
    }

    if (!this.overlayRef.hasAttached()) {
      this.overlayRef.attach(this.tourPortal);
    }
  }

  private renderCurrentStep(): void {
    this.disconnectTargetObservers();
    this.stepPanelStyle = this.centeredPanelStyle();
    this.targetHighlightStyle = null;
    this.targetDimStyle = null;
    this.interactionBlockerStyles = [];
    this.changeDetectorRef.detectChanges();

    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    view.requestAnimationFrame(() => {
      this.positionCurrentStep();
      this.stepComponent?.focusHeading();
    });
  }

  private positionCurrentStep(): void {
    const flatStep = this.currentFlatStep;
    const panel = this.stepPanel?.nativeElement;
    const view = this.document.defaultView;

    if (!flatStep || !panel || !view) {
      return;
    }

    const target = this.findTarget(flatStep.step.target);
    const dimTarget = this.findTarget(flatStep.step.dimTarget);
    const spotlightTargets = this.findTargets(
      flatStep.step.spotlightTargets || []
    );

    this.targetDimStyle = dimTarget
      ? this.styleForRect(dimTarget.getBoundingClientRect())
      : null;

    if (!target) {
      this.stepPanelStyle = this.centeredPanelStyle();
      this.targetHighlightStyle = null;
      this.interactionBlockerStyles = [{ inset: '0' }];
      return;
    }

    const highlightedTargets = [
      target,
      ...spotlightTargets.filter(
        (spotlightTarget) => spotlightTarget !== target
      ),
    ];
    this.observeTargets(target, highlightedTargets);
    target.scrollIntoView({ block: 'center', inline: 'nearest' });

    const margin = 16;
    const gap = 16;
    const targetRect = target.getBoundingClientRect();
    const highlightRect = this.unionRect(highlightedTargets);
    const panelRect = panel.getBoundingClientRect();
    const panelWidth = panelRect.width;
    const panelHeight = panelRect.height;
    const interactionRect = this.expandRect(
      highlightRect,
      flatStep.step.interactionInsets
    );
    this.interactionBlockerStyles = this.blockerStylesAround(
      interactionRect,
      view.innerWidth,
      view.innerHeight
    );
    if (this.targetDimStyle) {
      this.interactionBlockerStyles.push(this.targetDimStyle);
    }
    const placement = flatStep.step.placement || 'right';
    const position = this.positionForPlacement(
      placement,
      targetRect,
      panelWidth,
      panelHeight,
      gap,
      view.innerWidth,
      view.innerHeight,
      margin
    );

    const maxLeft = Math.max(margin, view.innerWidth - panelWidth - margin);
    const maxTop = Math.max(margin, view.innerHeight - panelHeight - margin);
    const left = Math.min(Math.max(position.left, margin), maxLeft);
    const top = Math.min(Math.max(position.top, margin), maxTop);

    this.stepPanelStyle = {
      left: `${left}px`,
      top: `${top}px`,
      transform: 'none',
    };
    this.targetHighlightStyle = {
      left: `${Math.max(highlightRect.left - 4, 0)}px`,
      top: `${Math.max(highlightRect.top - 4, 0)}px`,
      width: `${Math.max(highlightRect.width + 8, 0)}px`,
      height: `${Math.max(highlightRect.height + 8, 0)}px`,
    };
  }

  private unionRect(targets: HTMLElement[]): DOMRect {
    const rects = targets.map((target) => target.getBoundingClientRect());
    const left = Math.min(...rects.map((rect) => rect.left));
    const top = Math.min(...rects.map((rect) => rect.top));
    const right = Math.max(...rects.map((rect) => rect.right));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));

    return new DOMRect(left, top, right - left, bottom - top);
  }

  private styleForRect(rect: DOMRect): TourPositionStyle {
    return {
      left: `${Math.max(rect.left, 0)}px`,
      top: `${Math.max(rect.top, 0)}px`,
      width: `${Math.max(rect.width, 0)}px`,
      height: `${Math.max(rect.height, 0)}px`,
    };
  }

  private expandRect(
    rect: DOMRect,
    insets?: Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  ): DOMRect {
    if (!insets) {
      return rect;
    }

    const left = rect.left - (insets.left || 0);
    const top = rect.top - (insets.top || 0);
    const right = rect.right + (insets.right || 0);
    const bottom = rect.bottom + (insets.bottom || 0);

    return new DOMRect(left, top, right - left, bottom - top);
  }

  private blockerStylesAround(
    rect: DOMRect,
    viewportWidth: number,
    viewportHeight: number
  ): TourPositionStyle[] {
    return [
      {
        left: '0',
        top: '0',
        width: `${viewportWidth}px`,
        height: `${Math.max(rect.top, 0)}px`,
      },
      {
        left: '0',
        top: `${Math.max(rect.top, 0)}px`,
        width: `${Math.max(rect.left, 0)}px`,
        height: `${Math.max(rect.height, 0)}px`,
      },
      {
        left: `${Math.min(rect.right, viewportWidth)}px`,
        top: `${Math.max(rect.top, 0)}px`,
        width: `${Math.max(viewportWidth - rect.right, 0)}px`,
        height: `${Math.max(rect.height, 0)}px`,
      },
      {
        left: '0',
        top: `${Math.min(rect.bottom, viewportHeight)}px`,
        width: `${viewportWidth}px`,
        height: `${Math.max(viewportHeight - rect.bottom, 0)}px`,
      },
    ];
  }

  private findTargets(selectors: string[]): HTMLElement[] {
    return selectors.flatMap((selector) => {
      try {
        return Array.from(
          this.document.querySelectorAll<HTMLElement>(selector)
        ).filter((target) => {
          const rect = target.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
      } catch {
        return [];
      }
    });
  }

  private observeTargets(
    primaryTarget: HTMLElement,
    highlightedTargets: HTMLElement[]
  ): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    const mutationRoot =
      primaryTarget.querySelector<HTMLElement>('noah-search') ||
      primaryTarget.closest<HTMLElement>('noah-search') ||
      primaryTarget;

    if (this.observedMutationRoot !== mutationRoot) {
      this.targetMutationObserver?.disconnect();
      this.targetMutationObserver = new MutationObserver(() =>
        this.scheduleReposition()
      );
      this.targetMutationObserver.observe(mutationRoot, {
        childList: true,
        subtree: true,
      });
      this.observedMutationRoot = mutationRoot;
    }

    const targetsChanged =
      highlightedTargets.length !== this.observedResizeTargets.length ||
      highlightedTargets.some(
        (target, index) => target !== this.observedResizeTargets[index]
      );

    if (targetsChanged && typeof ResizeObserver !== 'undefined') {
      this.targetResizeObserver?.disconnect();
      this.targetResizeObserver = new ResizeObserver(() =>
        this.scheduleReposition()
      );
      highlightedTargets.forEach((target) =>
        this.targetResizeObserver?.observe(target)
      );
      this.observedResizeTargets = highlightedTargets;
    }
  }

  private scheduleReposition(): void {
    const view = this.document.defaultView;
    if (!view || this.repositionFrameId !== null || this.phase !== 'tour') {
      return;
    }

    this.repositionFrameId = view.requestAnimationFrame(() => {
      this.repositionFrameId = null;
      this.positionCurrentStep();
      this.changeDetectorRef.detectChanges();
    });
  }

  private disconnectTargetObservers(): void {
    const view = this.document.defaultView;
    if (view && this.repositionFrameId !== null) {
      view.cancelAnimationFrame(this.repositionFrameId);
    }

    this.repositionFrameId = null;
    this.targetMutationObserver?.disconnect();
    this.targetMutationObserver = null;
    this.targetResizeObserver?.disconnect();
    this.targetResizeObserver = null;
    this.observedMutationRoot = null;
    this.observedResizeTargets = [];
  }

  private findTarget(selector?: string): HTMLElement | null {
    if (!selector) {
      return null;
    }

    try {
      const targets = Array.from(
        this.document.querySelectorAll<HTMLElement>(selector)
      );

      return (
        targets.find((target) => {
          const rect = target.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }) ||
        targets[0] ||
        null
      );
    } catch {
      return null;
    }
  }

  private positionForPlacement(
    placement: TourPlacement,
    target: DOMRect,
    panelWidth: number,
    panelHeight: number,
    gap: number,
    viewportWidth: number,
    viewportHeight: number,
    margin: number
  ): { left: number; top: number } {
    switch (placement) {
      case 'upper-left':
        return {
          left: margin,
          top: margin,
        };
      case 'upper-right':
        return {
          left: viewportWidth - panelWidth - margin,
          top: margin,
        };
      case 'bottom-left':
        return {
          left: margin,
          top: viewportHeight - panelHeight - margin,
        };
      case 'bottom-right':
        return {
          left: viewportWidth - panelWidth - margin,
          top: viewportHeight - panelHeight - margin,
        };
      case 'center':
        return {
          left: (viewportWidth - panelWidth) / 2,
          top: (viewportHeight - panelHeight) / 2,
        };
      case 'left':
        return {
          left: target.left - panelWidth - gap,
          top: target.top + (target.height - panelHeight) / 2,
        };
      case 'top':
        return {
          left: target.left + (target.width - panelWidth) / 2,
          top: target.top - panelHeight - gap,
        };
      case 'bottom':
        return {
          left: target.left + (target.width - panelWidth) / 2,
          top: target.bottom + gap,
        };
      case 'right':
      default:
        return {
          left: target.right + gap,
          top: target.top + (target.height - panelHeight) / 2,
        };
    }
  }

  private centeredPanelStyle(): TourPositionStyle {
    return {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }
}
