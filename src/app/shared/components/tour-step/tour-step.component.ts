import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { TourStep } from '../tour/tour.models';

@Component({
  selector: 'noah-tour-step',
  templateUrl: './tour-step.component.html',
  styleUrls: ['./tour-step.component.scss'],
})
export class TourStepComponent {
  @Input() tourTitle = '';
  @Input() step: TourStep | null = null;
  @Input() currentStepNumber = 0;
  @Input() totalSteps = 0;
  @Input() hasPrevious = false;
  @Input() hasNext = false;

  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('heading') heading?: ElementRef<HTMLHeadingElement>;

  focusHeading(): void {
    this.heading?.nativeElement.focus();
  }
}
