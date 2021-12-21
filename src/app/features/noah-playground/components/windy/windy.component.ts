import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { Observable } from 'rxjs';
@Component({
  selector: 'noah-windy',
  templateUrl: './windy.component.html',
  styleUrls: ['./windy.component.scss'],
})
export class WindyComponent implements OnInit {
  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {}
}
