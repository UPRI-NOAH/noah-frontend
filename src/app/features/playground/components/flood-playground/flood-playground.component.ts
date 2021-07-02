import { Component, OnInit } from '@angular/core';
import { PlaygroundService } from '@features/playground/services/playground.service';
import { FloodReturnPeriod } from '@features/playground/store/playground.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-flood-playground',
  templateUrl: './flood-playground.component.html',
  styleUrls: ['./flood-playground.component.scss'],
})
export class FloodPlaygroundComponent implements OnInit {
  currentFloodReturnPeriod$: Observable<FloodReturnPeriod>;

  isOpenedList: number;
  openMenu(source: number) {
    this.isOpenedList = source;
  }
  closeMenu() {
    this.isOpenedList = -1;
  }

  constructor(private playgroundService: PlaygroundService) {}

  ngOnInit(): void {
    this.currentFloodReturnPeriod$ =
      this.playgroundService.currentFloodReturnPeriod$;
  }

  viewReturnPeriod(returnPeriod: FloodReturnPeriod) {
    this.playgroundService.setCurrentFloodReturnPeriod(returnPeriod);
  }
}
