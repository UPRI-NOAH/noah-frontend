import { Component, Input, OnInit } from '@angular/core';

// NOTE: Temporary implementation
// Transfer logic to store later
@Component({
  selector: 'noah-pra-nav',
  templateUrl: './pra-nav.component.html',
  styleUrls: ['./pra-nav.component.scss'],
})
export class PraNavComponent implements OnInit {
  @Input() currentPageIdx = 0;
  @Input() prevRoute: string = '';
  @Input() nextRoute: string = '';
  @Input() pageLength = 0;

  get currentPageCount(): number {
    return this.currentPageIdx + 1;
  }

  constructor() {}

  ngOnInit(): void {}
}
