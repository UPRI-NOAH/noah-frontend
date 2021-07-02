import { Component, OnInit } from '@angular/core';
import { PlaygroundService } from '@features/playground/services/playground.service';
import { LandslideHazards } from '@features/playground/store/playground.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-landslide-playground',
  templateUrl: './landslide-playground.component.html',
  styleUrls: ['./landslide-playground.component.scss'],
})
export class LandslidePlaygroundComponent implements OnInit {
  currentLandslideHazards$: Observable<LandslideHazards>;

  isOpenedList: number;
  openMenu(source: number) {
    this.isOpenedList = source;
  }
  closeMenu() {
    this.isOpenedList = -1;
  }

  constructor(private playgroundService: PlaygroundService) {}

  ngOnInit(): void {
    this.currentLandslideHazards$ =
      this.playgroundService.currentLandslideHazards$;
  }

  viewLandslideHazards(landslideHazards: LandslideHazards) {
    this.playgroundService.setCurrentLandslideHazards(landslideHazards);
  }
}
