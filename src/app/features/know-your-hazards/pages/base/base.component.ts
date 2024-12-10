import { Component, OnInit } from '@angular/core';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss'],
})
export class BaseComponent implements OnInit {
  currentLocation$: Observable<string>;
  currentPage: number = 1;

  constructor(private kyhService: KyhService) {}

  ngOnInit(): void {
    this.currentLocation$ = this.kyhService.currentLocation$;
  }

  selectPlace(selectedPlace) {
    this.kyhService.setCurrentLocation(selectedPlace.text);
    const [lng, lat] = selectedPlace.center;
    this.kyhService.setCenter({ lat, lng });
    this.kyhService.setCurrentCoords({ lat, lng });
  }

  changePage() {
    if (this.currentPage == 1) {
      this.currentPage = 2;
    } else {
      this.currentPage = 1;
    }
  }

  noahBrowser() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      const userAgent = navigator.userAgent.toLowerCase();

      if (userAgent.includes('android')) {
        // For Android, use intent://
        window.location.href =
          'intent://noah.up.edu.ph/noah-studio#Intent;scheme=https;package=com.android.chrome;end';
      } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        // For iOS, open normally (Safari will handle it as the default browser)
        const link = document.createElement('a');
        link.href = 'https://noah.up.edu.ph/noah-studio';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      // Desktop behavior
      window.open('https://noah.up.edu.ph/noah-studio', '_blank');
    }
  }
}
