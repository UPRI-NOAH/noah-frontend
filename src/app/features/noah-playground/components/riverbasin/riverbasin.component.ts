import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';

@Component({
  selector: 'noah-riverbasin',
  templateUrl: './riverbasin.component.html',
  styleUrls: ['./riverbasin.component.scss'],
})
export class RiverbasinComponent implements OnInit {
  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;
  initialOpacityValue = 80;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.shown$ = this.pgService.riverbasinShown$;
    this.expanded$ = this.pgService.riverbasinExpanded$;
    this.pgService.riverbasinOpacity$.pipe(first()).subscribe((opacity) => {
      this.initialOpacityValue = opacity;
    });
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleRiverbasinGroupVisibility();
  }

  toggleExpanded() {
    this.pgService.toggleRiverbasinGroupExpansion();
  }

  changeOpacity(opacity: number) {
    this.pgService.setRiverbasinOpacity(opacity);
  }
}
