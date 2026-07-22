import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { TourStep } from '../tour/tour.models';

interface TourTextSegment {
  text: string;
  bold: boolean;
}

@Component({
  selector: 'noah-tour-step',
  templateUrl: './tour-step.component.html',
  styleUrls: ['./tour-step.component.scss'],
})
export class TourStepComponent {
  @Input() tourTitle = '';
  @Input()
  set step(value: TourStep | null) {
    this._step = value;
    this.textParagraphs = this.parseParagraphs(value?.text || '');
  }
  get step(): TourStep | null {
    return this._step;
  }

  @Input() currentStepNumber = 0;
  @Input() totalSteps = 0;
  @Input() hasPrevious = false;
  @Input() hasNext = false;

  textParagraphs: TourTextSegment[][] = [];

  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('heading') heading?: ElementRef<HTMLHeadingElement>;

  private _step: TourStep | null = null;

  focusHeading(): void {
    this.heading?.nativeElement.focus();
  }

  private parseParagraphs(text: string): TourTextSegment[][] {
    return text.split(/\n\s*\n/).map((paragraph) => this.parseText(paragraph));
  }

  private parseText(text: string): TourTextSegment[] {
    const segments: TourTextSegment[] = [];
    const boldPattern = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = boldPattern.exec(text))) {
      if (match.index > lastIndex) {
        segments.push({
          text: text.slice(lastIndex, match.index),
          bold: false,
        });
      }

      segments.push({ text: match[1], bold: true });
      lastIndex = boldPattern.lastIndex;
    }

    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), bold: false });
    }

    return segments;
  }
}
