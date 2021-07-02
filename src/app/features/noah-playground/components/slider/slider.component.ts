import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'noah-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
})
export class SliderComponent implements OnInit, OnDestroy {
  @Input() label: string;
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 1;
  // Note: This can only be an initialValue. Do not pass an observable.
  @Input() initialValue: number = 75;
  @Output() valueChange = new EventEmitter();

  sliderCtrl: FormControl;

  private _unsub = new Subject();

  constructor() {}

  ngOnInit(): void {
    this.sliderCtrl = new FormControl(this.initialValue);
    this.sliderCtrl.valueChanges
      .pipe(takeUntil(this._unsub))
      .subscribe((v) => this.valueChange.emit(v));
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
  }
}
