import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'noah-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
})
export class SliderComponent implements OnInit {
  @Input() label: string;
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 1;
  // Note: This can only be an initialValue. Do not pass an observable.
  @Input() initialValue: number = 75;
  @Output() valueChange = new EventEmitter();

  sliderCtrl: FormControl;

  constructor() {}

  ngOnInit(): void {
    this.sliderCtrl = new FormControl(this.initialValue);
  }

  onInput(value: string | number): void {
    const nextValue = Number(value);

    this.sliderCtrl.setValue(nextValue, { emitEvent: false });
    this.valueChange.emit(nextValue);
  }
}
