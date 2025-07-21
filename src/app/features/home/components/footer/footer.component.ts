import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'noah-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  constructor() {}
  private androidUrl =
    'https://play.google.com/store/apps/details?id=co.median.android.akawld&hl=en';
  private iosUrl = 'https://apps.apple.com/ph/app/up-noah/id6479632667';

  ngOnInit(): void {}

  installMobileApp() {
    const userAgent = navigator.userAgent || navigator.vendor;

    if (/android/i.test(userAgent)) {
      window.location.href = this.androidUrl;
    } else if (
      /iPad|iPhone|iPod/.test(userAgent) &&
      !(window as any).MSStream
    ) {
      window.location.href = this.iosUrl;
    } else {
      // Fallback: maybe show both links
      alert('Please open this page on your mobile device to download the app.');
    }
  }
}
