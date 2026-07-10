import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  LightningType,
  LightningTypes,
} from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

@Component({
  selector: 'noah-lightning',
  templateUrl: './lightning.component.html',
  styleUrls: ['./lightning.component.scss'],
})
export class LightningComponent implements OnInit {
  @Input() lightningType: LightningTypes;

  selectedLightning$: Observable<LightningTypes>;

  get displayName(): string {
    if (this.lightningType === '10mins-lightning') {
      return '10-Minute Lightning';
    }

    return this.lightningType.replace('-', ' ');
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.selectedLightning$ = this.pgService.selectedLightning$;
  }

  selectLightning(lightningType: LightningType) {
    this.pgService.setLightningType(lightningType);
  }
}
