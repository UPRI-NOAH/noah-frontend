import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'noah-hazard-level',
  templateUrl: './hazard-level.component.html',
  styleUrls: ['./hazard-level.component.scss'],
})
export class HazardLevelComponent implements OnInit, OnDestroy {
  @Input() id: string;
  @Input() name: string;

  shownCtrl: FormControl;

  private _unsub = new Subject();

  constructor() {}

  ngOnInit(): void {
    this.shownCtrl = new FormControl(false);
    this.shownCtrl.valueChanges
      .pipe(takeUntil(this._unsub))
      .subscribe((v) => console.log(v, this.id));
  }

  ngOnDestroy() {
    this._unsub.next();
    this._unsub.complete();
  }
}
