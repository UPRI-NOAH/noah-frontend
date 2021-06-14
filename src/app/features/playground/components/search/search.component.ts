import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'noah-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  searchTermCtrl: FormControl;

  constructor() {}

  ngOnInit(): void {
    this.searchTermCtrl = new FormControl();
    this.searchTermCtrl.valueChanges.subscribe((value) => console.log(value));
  }
}
