import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';

@Component({
  selector: 'noah-flood',
  templateUrl: './flood.component.html',
  styleUrls: ['./flood.component.scss'],
})
export class FloodComponent implements OnInit {
  constructor(private kyhService: KyhService, private router: Router) {}

  ngOnInit(): void {
    this.kyhService.setCurrentView('flood');
  }

  back(): void {
    this.router.navigateByUrl('/know-your-hazards');
    this.kyhService.setCurrentView('all');
  }
}
