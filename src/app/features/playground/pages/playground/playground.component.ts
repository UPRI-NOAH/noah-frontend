import { Component, OnInit } from '@angular/core';
import { PlaygroundService } from '@features/playground/services/playground.service';

@Component({
  selector: 'noah-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss'],
})
export class PlaygroundComponent implements OnInit {
  constructor(private PlaygroundService: PlaygroundService) {}

  ngOnInit(): void {}
}
