import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';

@Component({
  selector: 'noah-landslides',
  templateUrl: './landslides.component.html',
  styleUrls: ['./landslides.component.scss'],
})
export class LandslidesComponent implements OnInit {
  constructor(private kyhService: KyhService, private router: Router) {}

  ngOnInit(): void {
    this.kyhService.setCurrentView('landslide');
  }

  back(): void {
    this.router.navigateByUrl('/know-your-hazards');
    this.kyhService.setCurrentView('all');
  }
}
