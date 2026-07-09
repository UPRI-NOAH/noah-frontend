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

  private overlayRef: OverlayRef | null = null;

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

    this.currentStepIndex = 0;
    this.phase = 'tour';
    this.attachOverlay();
    this.renderCurrentStep();
  }

  closeTour(): void {
    this.phase = 'closed';
    this.currentStepIndex = 0;
    this.stepPanelStyle = {};
    this.targetHighlightStyle = null;
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

  showNextStep(): void {
    if (!this.hasNext) {
      return;
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
    this.stepPanelStyle = this.centeredPanelStyle();
    this.targetHighlightStyle = null;
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
    if (!target) {
      this.stepPanelStyle = this.centeredPanelStyle();
      this.targetHighlightStyle = null;
      return;
    }

    target.scrollIntoView({ block: 'center', inline: 'nearest' });

    const margin = 16;
    const gap = 16;
    const targetRect = target.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const panelWidth = panelRect.width;
    const panelHeight = panelRect.height;
    const placement = flatStep.step.placement || 'right';
    const position = this.positionForPlacement(
      placement,
      targetRect,
      panelWidth,
      panelHeight,
      gap
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
      left: `${Math.max(targetRect.left - 4, 0)}px`,
      top: `${Math.max(targetRect.top - 4, 0)}px`,
      width: `${Math.max(targetRect.width + 8, 0)}px`,
      height: `${Math.max(targetRect.height + 8, 0)}px`,
    };
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
    gap: number
  ): { left: number; top: number } {
    switch (placement) {
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
