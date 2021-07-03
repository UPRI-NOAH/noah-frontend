import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { ExaggerationState } from '@features/noah-playground/store/noah-playground.store';

@Component({
  selector: 'noah-exaggeration',
  templateUrl: './exaggeration.component.html',
  styleUrls: ['./exaggeration.component.scss'],
})
export class ExaggerationComponent implements OnInit {
  isOpenedList: boolean = true;
  exaggeration: ExaggerationState;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    // The only time we get the value from the state directly is when we're
    // initializing the value
    this.exaggeration = this.pgService.getExaggeration();
  }

  openMenu() {
    this.isOpenedList = true;

    this.exaggeration = {
      ...this.exaggeration,
      expanded: this.isOpenedList,
    };

    this.pgService.setExaggeration(this.exaggeration);
  }

  changeExaggerationLevel(level: number) {
    this.exaggeration = {
      ...this.exaggeration,
      level,
    };

    this.pgService.setExaggeration(this.exaggeration);
  }

  closeMenu() {
    this.isOpenedList = false;

    this.exaggeration = {
      ...this.exaggeration,
      expanded: this.isOpenedList,
    };

    this.pgService.setExaggeration(this.exaggeration);
  }
}
