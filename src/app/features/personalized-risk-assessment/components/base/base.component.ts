import { Component, OnInit } from '@angular/core';
import { PraService } from '@features/personalized-risk-assessment/services/pra.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss'],
})
export class BaseComponent implements OnInit {
  isFlood: boolean = false;
  islandSlide: boolean = false;
  isStorm: boolean = false;

  currentLocation$: Observable<string>;

  constructor(private praService: PraService) {}

  ngOnInit(): void {
    this.praService.setCurrentPage('base');
    this.currentLocation$ = this.praService.currentLocation$;
  }
}
