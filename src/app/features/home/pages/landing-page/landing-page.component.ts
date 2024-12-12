import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
@Component({
  selector: 'noah-landing-page',
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent implements OnInit {
  searchTerm: string;
  isDropdownOpen = false;

  constructor(
    private kyhService: KyhService,
    private router: Router,
    private title: Title
  ) {}

  ngOnInit(): void {
    this.title.setTitle('NOAH - Nationwide Operational Assessment of Hazards');
  }

  selectPlace(selectedPlace) {
    this.kyhService.setCurrentLocation(selectedPlace.text);
    const [lng, lat] = selectedPlace.center;
    this.kyhService.setCenter({ lat, lng });
    this.kyhService.setCurrentCoords({ lat, lng });
    this.router.navigate(['know-your-hazards']);
  }

  gotoTop() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
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
