import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TourSection } from '../tour/tour.models';

@Component({
  selector: 'noah-tour-navbar',
  templateUrl: './tour-navbar.component.html',
  styleUrls: ['./tour-navbar.component.scss'],
})
export class TourNavbarComponent {
  @Input() sections: TourSection[] = [];
  @Input() activeSectionId: string | null = null;

  @Output() sectionSelected = new EventEmitter<string>();

  selectSection(sectionId: string): void {
    this.sectionSelected.emit(sectionId);
  }

  trackBySectionId(_index: number, section: TourSection): string {
    return section.id;
  }
}
