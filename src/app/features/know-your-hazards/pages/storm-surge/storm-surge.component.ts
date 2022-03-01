import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';

@Component({
  selector: 'noah-storm-surge',
  templateUrl: './storm-surge.component.html',
  styleUrls: ['./storm-surge.component.scss'],
})
export class StormSurgeComponent implements OnInit {
  constructor(private kyhService: KyhService, private router: Router) {}

  ngOnInit(): void {
    this.kyhService.setCurrentView('storm-surge');
  }

  back(): void {
    this.router.navigateByUrl('/know-your-hazards');
    this.kyhService.setCurrentView('all');
  }
}
