import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { TourSection } from '../tour/tour.models';

@Component({
  selector: 'noah-tour-navbar',
  templateUrl: './tour-navbar.component.html',
  styleUrls: ['./tour-navbar.component.scss'],
})
export class TourNavbarComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() sections: TourSection[] = [];
  @Input() activeSectionId: string | null = null;

  @Output() sectionSelected = new EventEmitter<string>();

  @ViewChild('navbar', { static: true })
  private navbar: ElementRef<HTMLElement>;

  @ViewChildren('sectionItem')
  private sectionItems: QueryList<ElementRef<HTMLButtonElement>>;

  private viewInitialized = false;
  private scrollFrameId: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.activeSectionId || changes.sections) {
      this.scheduleActiveSectionReveal();
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.scheduleActiveSectionReveal();
  }

  ngOnDestroy(): void {
    const view = this.navbar?.nativeElement.ownerDocument.defaultView;
    if (view && this.scrollFrameId !== null) {
      view.cancelAnimationFrame(this.scrollFrameId);
    }
  }

  selectSection(sectionId: string): void {
    this.sectionSelected.emit(sectionId);
  }

  trackBySectionId(_index: number, section: TourSection): string {
    return section.id;
  }

  private scheduleActiveSectionReveal(): void {
    if (!this.viewInitialized || !this.navbar) {
      return;
    }

    const view = this.navbar.nativeElement.ownerDocument.defaultView;
    if (!view) {
      return;
    }

    if (this.scrollFrameId !== null) {
      view.cancelAnimationFrame(this.scrollFrameId);
    }

    this.scrollFrameId = view.requestAnimationFrame(() => {
      this.scrollFrameId = null;
      this.revealActiveSection();
    });
  }

  private revealActiveSection(): void {
    const activeSectionIndex = this.sections.findIndex(
      (section) => section.id === this.activeSectionId
    );
    const activeSection =
      this.sectionItems.get(activeSectionIndex)?.nativeElement;
    const navbar = this.navbar.nativeElement;
    const view = navbar.ownerDocument.defaultView;

    if (!activeSection || !view) {
      return;
    }

    const navbarRect = navbar.getBoundingClientRect();
    const activeSectionRect = activeSection.getBoundingClientRect();
    let targetScrollLeft: number | null = null;

    if (activeSectionRect.left < navbarRect.left) {
      targetScrollLeft =
        navbar.scrollLeft + activeSectionRect.left - navbarRect.left;
    } else if (activeSectionRect.right > navbarRect.right) {
      targetScrollLeft =
        navbar.scrollLeft + activeSectionRect.right - navbarRect.right;
    }

    if (targetScrollLeft === null) {
      return;
    }

    const prefersReducedMotion =
      view.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    navbar.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }
}
