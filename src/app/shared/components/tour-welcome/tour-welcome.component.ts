import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TourWelcomeContent } from '../tour/tour.models';

@Component({
  selector: 'noah-tour-welcome',
  templateUrl: './tour-welcome.component.html',
  styleUrls: ['./tour-welcome.component.scss'],
})
export class TourWelcomeComponent {
  @Input() content: TourWelcomeContent | null = null;
  @Input() tourTitle = '';

  @Output() start = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
}
