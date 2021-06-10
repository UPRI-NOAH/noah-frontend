import { Component, OnInit } from '@angular/core';
import { PlaygroundService } from '@features/playground/services/playground.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss'],
})
export class PlaygroundComponent implements OnInit {
  currentLocationPg$: Observable<string>;

  constructor(private PlaygroundService: PlaygroundService) {}

  ngOnInit(): void {
    this.currentLocationPg$ = this.PlaygroundService.currentLocationPg$;
  }
}
