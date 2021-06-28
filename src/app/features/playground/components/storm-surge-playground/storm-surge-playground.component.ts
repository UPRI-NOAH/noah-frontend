import { Component, OnInit } from '@angular/core';
import { PlaygroundService } from '@features/playground/services/playground.service';
import { StormSurgeAdvisory } from '@features/playground/store/playground.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-storm-surge-playground',
  templateUrl: './storm-surge-playground.component.html',
  styleUrls: ['./storm-surge-playground.component.scss'],
})
export class StormSurgePlaygroundComponent implements OnInit {
  currentStormSurgeAdvisory$: Observable<StormSurgeAdvisory>;

  isOpenedList: number;
  openMenu(source: number) {
    this.isOpenedList = source;
  }
  closeMenu() {
    this.isOpenedList = -1;
  }

  constructor(private playgroundService: PlaygroundService) {}

  ngOnInit(): void {
    this.currentStormSurgeAdvisory$ =
      this.playgroundService.currentStormSurgeAdvisory$;
  }

  viewStormSurgeAdvisory(stormsurgeAdvisory: StormSurgeAdvisory) {
    this.playgroundService.setCurrentStormSurgeAdvisory(stormsurgeAdvisory);
  }
}
