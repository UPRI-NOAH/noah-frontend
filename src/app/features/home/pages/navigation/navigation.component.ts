import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'noah-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit {
  isMenu: boolean = false;
  isList: number;
  isSearch: boolean = false;
  constructor() {}

  ngOnInit(): void {}
}
