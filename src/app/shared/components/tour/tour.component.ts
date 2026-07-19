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

interface TourPanelPosition {
  left: number;
  top: number;
  maxHeight?: number;
}

interface MobilePanelCandidate extends TourPanelPosition {
  side: 'top' | 'bottom';
  availableHeight: number;
  avoidOverlap: number;
}

const MOBILE_BREAKPOINT = 768;
const MOBILE_PANEL_MARGIN = 12;
const MOBILE_PANEL_GAP = 12;
const MOBILE_MIN_PANEL_HEIGHT = 240;

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
  targetHighlightStyles: TourPositionStyle[] = [];
  highlightMaskStyles: TourPositionStyle[] = [];
  targetDimStyles: TourPositionStyle[] = [];
  interactionBlockerStyles: TourPositionStyle[] = [];

  private overlayRef: OverlayRef | null = null;
  private targetMutationObserver: MutationObserver | null = null;
  private targetResizeObserver: ResizeObserver | null = null;
  private observedMutationRoot: HTMLElement | null = null;
  private observedResizeTargets: HTMLElement[] = [];
  private repositionFrameId: number | null = null;
  private observingDocumentScroll = false;
  private readonly handleDocumentScroll = (): void => this.scheduleReposition();

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
    this.changeDetectorRef.detectChanges();
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
    this.targetHighlightStyles = [];
    this.highlightMaskStyles = [];
    this.targetDimStyles = [];
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

  @HostListener('window:scroll')
  repositionCurrentStep(): void {
    if (this.phase === 'tour') {
      this.positionCurrentStep();
    }
  }

  @HostListener('window:resize')
  handleWindowResize(): void {
    if (this.phase !== 'tour') {
      return;
    }

    if (this.stepPanelStyle['max-height']) {
      const positionStyle = { ...this.stepPanelStyle };
      delete positionStyle['max-height'];
      this.stepPanelStyle = positionStyle;
      this.changeDetectorRef.detectChanges();
    }

    this.positionCurrentStep();
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
    this.targetHighlightStyles = [];
    this.highlightMaskStyles = [];
    this.targetDimStyles = [];
    this.interactionBlockerStyles = [];
    this.changeDetectorRef.detectChanges();

    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    view.requestAnimationFrame(() => {
      this.positionCurrentStep(true);
      this.stepComponent?.focusHeading();
    });
  }

  private positionCurrentStep(scrollTargetIntoView = false): void {
    const flatStep = this.currentFlatStep;
    const panel = this.stepPanel?.nativeElement;
    const view = this.document.defaultView;

    if (!flatStep || !panel || !view) {
      return;
    }

    const target = this.findTarget(flatStep.step.target);
    const dimTargets = this.findTargets(flatStep.step.dimTargets || []);
    const spotlightTargets = this.findTargets(
      flatStep.step.spotlightTargets || []
    );
    const interactionTargets = this.findTargets(
      flatStep.step.interactionTargets || []
    );
    const panelAvoidTargets = this.findTargets(
      flatStep.step.panelAvoidTargets || []
    );
    const isMobile = this.isMobileViewport(view.innerWidth);
    const mobilePanelTarget = isMobile
      ? this.findTarget(flatStep.step.mobilePanelTarget)
      : null;
    const observedPanelAvoidTargets = this.findAllTargets(
      flatStep.step.panelAvoidTargets || []
    );
    this.targetDimStyles = dimTargets.map((dimTarget) =>
      this.styleForRect(dimTarget.getBoundingClientRect())
    );

    if (!target) {
      this.stepPanelStyle = this.centeredPanelStyle();
      this.targetHighlightStyles = [];
      this.highlightMaskStyles = [];
      this.interactionBlockerStyles = [{ inset: '0' }];
      return;
    }

    const highlightedTargets = [
      target,
      ...spotlightTargets.filter(
        (spotlightTarget) => spotlightTarget !== target
      ),
    ];
    const interactiveTargets = [
      ...highlightedTargets,
      ...interactionTargets.filter(
        (interactionTarget) => !highlightedTargets.includes(interactionTarget)
      ),
    ];
    this.observeTargets(target, [
      ...interactiveTargets,
      ...dimTargets,
      ...observedPanelAvoidTargets,
      ...(mobilePanelTarget ? [mobilePanelTarget] : []),
    ]);
    if (scrollTargetIntoView) {
      target.scrollIntoView({ block: 'center', inline: 'nearest' });
    }

    const margin = isMobile ? MOBILE_PANEL_MARGIN : 16;
    const gap = isMobile ? MOBILE_PANEL_GAP : 16;
    const getVisibleHighlightRects = (): DOMRect[] =>
      highlightedTargets
        .map((highlightedTarget) =>
          this.visibleRectForTarget(
            highlightedTarget,
            view.innerWidth,
            view.innerHeight,
            {
              top: 4,
              right: 4,
              bottom: 4,
              left: 4,
            }
          )
        )
        .filter((rect) => rect.width > 0 && rect.height > 0);
    let highlightRects = getVisibleHighlightRects();

    if (highlightRects.length === 0 && this.hasClippingAncestor(target)) {
      target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      highlightRects = getVisibleHighlightRects();

      if (highlightRects.length === 0) {
        return;
      }
    }

    const visibleTargetRect = this.visibleRectForTarget(
      target,
      view.innerWidth,
      view.innerHeight
    );
    const targetRect =
      visibleTargetRect.width > 0 && visibleTargetRect.height > 0
        ? visibleTargetRect
        : target.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const panelWidth = panelRect.width;
    const panelHeight = panelRect.height;
    const interactionRects = interactiveTargets
      .map((interactiveTarget) =>
        this.visibleRectForTarget(
          interactiveTarget,
          view.innerWidth,
          view.innerHeight,
          flatStep.step.interactionInsets
        )
      )
      .filter((rect) => rect.width > 0 && rect.height > 0);
    this.targetHighlightStyles = highlightRects.map((highlightRect) =>
      this.styleForRect(highlightRect)
    );
    this.highlightMaskStyles = this.stylesOutsideRects(
      highlightRects,
      view.innerWidth,
      view.innerHeight
    );
    this.interactionBlockerStyles = this.stylesOutsideRects(
      interactionRects,
      view.innerWidth,
      view.innerHeight
    );
    this.interactionBlockerStyles.push(...this.targetDimStyles);
    const placement = flatStep.step.placement || 'right';
    const avoidRects = panelAvoidTargets.map((avoidTarget) =>
      avoidTarget.getBoundingClientRect()
    );
    const position: TourPanelPosition = isMobile
      ? this.positionInMobileContainer(
          mobilePanelTarget?.getBoundingClientRect() || null,
          panelWidth,
          panelHeight,
          view.innerWidth,
          view.innerHeight
        ) ||
        this.positionForMobile(
          this.boundingRect(
            highlightRects.length ? highlightRects : [targetRect]
          ),
          targetRect,
          placement,
          panelWidth,
          panelHeight,
          view.innerWidth,
          view.innerHeight,
          avoidRects
        )
      : this.positionToAvoidTargets(
          this.positionForPlacement(
            placement,
            targetRect,
            panelWidth,
            panelHeight,
            gap,
            view.innerWidth,
            view.innerHeight,
            margin
          ),
          placement,
          panelWidth,
          panelHeight,
          avoidRects,
          gap
        );

    const maxLeft = Math.max(margin, view.innerWidth - panelWidth - margin);
    const positionedPanelHeight = Math.min(
      panelHeight,
      position.maxHeight || panelHeight
    );
    const maxTop = Math.max(
      margin,
      view.innerHeight - positionedPanelHeight - margin
    );
    const left = Math.min(Math.max(position.left, margin), maxLeft);
    const top = Math.min(Math.max(position.top, margin), maxTop);

    this.stepPanelStyle = {
      left: `${left}px`,
      top: `${top}px`,
      transform: 'none',
      ...(position.maxHeight
        ? { 'max-height': `${position.maxHeight}px` }
        : {}),
    };
  }

  private isMobileViewport(viewportWidth: number): boolean {
    return viewportWidth < MOBILE_BREAKPOINT;
  }

  private boundingRect(rects: DOMRect[]): DOMRect {
    const left = Math.min(...rects.map((rect) => rect.left));
    const top = Math.min(...rects.map((rect) => rect.top));
    const right = Math.max(...rects.map((rect) => rect.right));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));

    return new DOMRect(left, top, right - left, bottom - top);
  }

  private visibleRectForTarget(
    target: HTMLElement,
    viewportWidth: number,
    viewportHeight: number,
    insets?: Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  ): DOMRect {
    const view = this.document.defaultView;
    let rect = this.expandRect(target.getBoundingClientRect(), insets);
    let left = Math.max(rect.left, 0);
    let top = Math.max(rect.top, 0);
    let right = Math.min(rect.right, viewportWidth);
    let bottom = Math.min(rect.bottom, viewportHeight);
    let ancestor = target.parentElement;

    while (view && ancestor && ancestor !== this.document.body) {
      const styles = view.getComputedStyle(ancestor);
      const clipsHorizontally = this.clipsOverflow(styles.overflowX);
      const clipsVertically = this.clipsOverflow(styles.overflowY);

      if (clipsHorizontally || clipsVertically) {
        rect = ancestor.getBoundingClientRect();
        if (clipsHorizontally) {
          left = Math.max(left, rect.left);
          right = Math.min(right, rect.right);
        }
        if (clipsVertically) {
          top = Math.max(top, rect.top);
          bottom = Math.min(bottom, rect.bottom);
        }
      }

      ancestor = ancestor.parentElement;
    }

    return new DOMRect(
      left,
      top,
      Math.max(0, right - left),
      Math.max(0, bottom - top)
    );
  }

  private clipsOverflow(overflow: string): boolean {
    return ['auto', 'clip', 'hidden', 'scroll'].includes(overflow);
  }

  private hasClippingAncestor(target: HTMLElement): boolean {
    const view = this.document.defaultView;
    let ancestor = target.parentElement;

    while (view && ancestor && ancestor !== this.document.body) {
      const styles = view.getComputedStyle(ancestor);
      if (
        this.clipsOverflow(styles.overflowX) ||
        this.clipsOverflow(styles.overflowY)
      ) {
        return true;
      }

      ancestor = ancestor.parentElement;
    }

    return false;
  }

  private positionInMobileContainer(
    containerRect: DOMRect | null,
    panelWidth: number,
    panelHeight: number,
    viewportWidth: number,
    viewportHeight: number
  ): TourPanelPosition | null {
    if (
      !containerRect ||
      containerRect.width <= 0 ||
      containerRect.height <= 0
    ) {
      return null;
    }

    const margin = MOBILE_PANEL_MARGIN;
    const containerLeft = Math.max(containerRect.left, 0);
    const containerRight = Math.min(containerRect.right, viewportWidth);
    const containerBottom = Math.min(containerRect.bottom, viewportHeight);
    const availableWidth = Math.max(
      0,
      containerRight - containerLeft - margin * 2
    );
    const maxPanelHeight = Math.max(0, viewportHeight - margin * 2);
    const positionedPanelHeight = Math.min(panelHeight, maxPanelHeight);

    if (
      availableWidth <= 0 ||
      containerBottom <= margin ||
      positionedPanelHeight <= 0
    ) {
      return null;
    }

    return {
      left: containerLeft + margin + (availableWidth - panelWidth) / 2,
      top: Math.max(margin, containerBottom - margin - positionedPanelHeight),
      maxHeight: positionedPanelHeight,
    };
  }

  private positionForMobile(
    protectedRect: DOMRect,
    targetRect: DOMRect,
    placement: TourPlacement,
    panelWidth: number,
    panelHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    avoidRects: DOMRect[]
  ): TourPanelPosition {
    const margin = MOBILE_PANEL_MARGIN;
    const gap = MOBILE_PANEL_GAP;
    const maxPanelHeight = Math.max(0, viewportHeight - margin * 2);
    const naturalPanelHeight = Math.min(panelHeight, maxPanelHeight);
    const left = Math.min(
      Math.max(
        protectedRect.left + (protectedRect.width - panelWidth) / 2,
        margin
      ),
      Math.max(margin, viewportWidth - panelWidth - margin)
    );
    const availableAbove = Math.max(0, protectedRect.top - gap - margin);
    const availableBelow = Math.max(
      0,
      viewportHeight - protectedRect.bottom - gap - margin
    );
    const requiredHeight = Math.min(
      naturalPanelHeight,
      MOBILE_MIN_PANEL_HEIGHT
    );
    const candidates: MobilePanelCandidate[] = [];

    const addCandidate = (
      side: 'top' | 'bottom',
      availableHeight: number
    ): void => {
      if (availableHeight < requiredHeight) {
        return;
      }

      const candidateHeight = Math.min(naturalPanelHeight, availableHeight);
      const top =
        side === 'top'
          ? protectedRect.top - gap - candidateHeight
          : protectedRect.bottom + gap;
      const candidateRect = new DOMRect(left, top, panelWidth, candidateHeight);

      candidates.push({
        side,
        left,
        top,
        maxHeight: candidateHeight,
        availableHeight,
        avoidOverlap: avoidRects.reduce(
          (overlap, rect) =>
            overlap + this.intersectionArea(candidateRect, rect),
          0
        ),
      });
    };

    addCandidate('top', availableAbove);
    addCandidate('bottom', availableBelow);

    if (candidates.length > 0) {
      const preferredSide = this.preferredMobileSide(placement);
      candidates.sort((first, second) => {
        if (first.avoidOverlap !== second.avoidOverlap) {
          return first.avoidOverlap - second.avoidOverlap;
        }

        if (preferredSide) {
          const firstIsPreferred = first.side === preferredSide;
          const secondIsPreferred = second.side === preferredSide;
          if (firstIsPreferred !== secondIsPreferred) {
            return firstIsPreferred ? -1 : 1;
          }
        }

        return second.availableHeight - first.availableHeight;
      });

      const bestCandidate = candidates[0];
      return {
        left: bestCandidate.left,
        top: bestCandidate.top,
        maxHeight: bestCandidate.maxHeight,
      };
    }

    const fallbackPosition = this.positionToAvoidTargets(
      this.positionForPlacement(
        placement,
        targetRect,
        panelWidth,
        naturalPanelHeight,
        gap,
        viewportWidth,
        viewportHeight,
        margin
      ),
      placement,
      panelWidth,
      naturalPanelHeight,
      avoidRects,
      gap
    );

    return {
      ...fallbackPosition,
      maxHeight: naturalPanelHeight,
    };
  }

  private preferredMobileSide(
    placement: TourPlacement
  ): 'top' | 'bottom' | null {
    if (placement === 'top' || placement.startsWith('upper-')) {
      return 'top';
    }

    if (placement === 'bottom' || placement.startsWith('bottom-')) {
      return 'bottom';
    }

    return null;
  }

  private intersectionArea(first: DOMRect, second: DOMRect): number {
    const width = Math.max(
      0,
      Math.min(first.right, second.right) - Math.max(first.left, second.left)
    );
    const height = Math.max(
      0,
      Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top)
    );

    return width * height;
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

  private stylesOutsideRects(
    rects: DOMRect[],
    viewportWidth: number,
    viewportHeight: number
  ): TourPositionStyle[] {
    const clippedRects = rects
      .map((rect) => {
        const left = Math.min(Math.max(rect.left, 0), viewportWidth);
        const top = Math.min(Math.max(rect.top, 0), viewportHeight);
        const right = Math.min(Math.max(rect.right, 0), viewportWidth);
        const bottom = Math.min(Math.max(rect.bottom, 0), viewportHeight);

        return new DOMRect(left, top, right - left, bottom - top);
      })
      .filter((rect) => rect.width > 0 && rect.height > 0);

    if (clippedRects.length === 0) {
      return [{ inset: '0' }];
    }

    const xCoordinates = Array.from(
      new Set([
        0,
        viewportWidth,
        ...clippedRects.flatMap((rect) => [rect.left, rect.right]),
      ])
    ).sort((left, right) => left - right);
    const yCoordinates = Array.from(
      new Set([
        0,
        viewportHeight,
        ...clippedRects.flatMap((rect) => [rect.top, rect.bottom]),
      ])
    ).sort((top, bottom) => top - bottom);
    const styles: TourPositionStyle[] = [];

    for (let yIndex = 0; yIndex < yCoordinates.length - 1; yIndex += 1) {
      const top = yCoordinates[yIndex];
      const bottom = yCoordinates[yIndex + 1];
      const middleY = (top + bottom) / 2;
      let blockedStart: number | null = null;

      for (let xIndex = 0; xIndex < xCoordinates.length - 1; xIndex += 1) {
        const left = xCoordinates[xIndex];
        const right = xCoordinates[xIndex + 1];
        const middleX = (left + right) / 2;
        const isAllowed = clippedRects.some(
          (rect) =>
            middleX >= rect.left &&
            middleX <= rect.right &&
            middleY >= rect.top &&
            middleY <= rect.bottom
        );

        if (!isAllowed && blockedStart === null) {
          blockedStart = left;
        }

        const isLastColumn = xIndex === xCoordinates.length - 2;
        if (blockedStart !== null && (isAllowed || isLastColumn)) {
          const blockedRight = isAllowed ? left : right;
          styles.push({
            left: `${blockedStart}px`,
            top: `${top}px`,
            width: `${blockedRight - blockedStart}px`,
            height: `${bottom - top}px`,
          });
          blockedStart = null;
        }
      }
    }

    return styles;
  }

  private findTargets(selectors: string[]): HTMLElement[] {
    return this.findAllTargets(selectors).filter((target) => {
      const rect = target.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  }

  private findAllTargets(selectors: string[]): HTMLElement[] {
    return selectors.flatMap((selector) => {
      try {
        return Array.from(
          this.document.querySelectorAll<HTMLElement>(selector)
        );
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

    if (!this.observingDocumentScroll) {
      this.document.addEventListener('scroll', this.handleDocumentScroll, true);
      this.observingDocumentScroll = true;
    }

    const mutationRoot =
      primaryTarget.closest<HTMLElement>('noah-root') ||
      primaryTarget.parentElement ||
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
    if (this.observingDocumentScroll) {
      this.document.removeEventListener(
        'scroll',
        this.handleDocumentScroll,
        true
      );
      this.observingDocumentScroll = false;
    }
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
          left: target.left + gap,
          top: target.top + gap,
        };
      case 'upper-right':
        return {
          left: target.right - panelWidth - gap,
          top: target.top + gap,
        };
      case 'bottom-left':
        return {
          left: target.left + gap,
          top: target.bottom - panelHeight - gap,
        };
      case 'bottom-right':
        return {
          left: target.right - panelWidth - gap,
          top: target.bottom - panelHeight - gap,
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

  private positionToAvoidTargets(
    position: { left: number; top: number },
    placement: TourPlacement,
    panelWidth: number,
    panelHeight: number,
    avoidRects: DOMRect[],
    gap: number
  ): { left: number; top: number } {
    if (placement !== 'left') {
      return position;
    }

    const panelRight = position.left + panelWidth;
    const panelBottom = position.top + panelHeight;
    const overlappingRects = avoidRects.filter(
      (rect) =>
        rect.left < panelRight &&
        rect.right > position.left &&
        rect.top < panelBottom &&
        rect.bottom > position.top
    );

    if (overlappingRects.length === 0) {
      return position;
    }

    return {
      left: Math.min(
        position.left,
        ...overlappingRects.map((rect) => rect.left - panelWidth - gap)
      ),
      top: position.top,
    };
  }

  private centeredPanelStyle(): TourPositionStyle {
    return {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }
}
