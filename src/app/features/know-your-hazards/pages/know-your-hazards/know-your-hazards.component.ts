import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
@Component({
  selector: 'noah-know-your-hazards',
  templateUrl: './know-your-hazards.component.html',
  styleUrls: ['./know-your-hazards.component.scss'],
})
export class KnowYourHazardsComponent implements OnInit {
  constructor(private kyhService: KyhService, private title: Title) {}

  ngOnInit(): void {
    this.title.setTitle('NOAH - Know Your Hazards');
    this.kyhService.init();
    this.kyhService.setCurrentView('all');
  }
}
