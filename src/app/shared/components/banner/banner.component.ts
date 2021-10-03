import { Component, AfterViewInit, Input, HostListener } from '@angular/core';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
})
export class BannerComponent implements AfterViewInit {
  @Input() lowResImgUrl: string;
  @Input() hiResImgUrl: string;
  @Input() mobileImgUrl: string;
  @Input() hasDarkOverlay = true;
  @Input() fullHeight = false;
  private _bgImgSrc;

  activeImgSrc: string;
  loadedFullRes = false;
  constructor() {}

  ngAfterViewInit() {
    this.activeImgSrc = this.lowResImgUrl;

    const imgLarge = new Image();
    imgLarge.onload = () => {
      this.activeImgSrc = this.hiResImgUrl;
      this.bgImgSrc = this.activeImgSrc;
      this.loadedFullRes = true;
    };

    imgLarge.src =
      this.isMaxMD && this.mobileImgUrl ? this.mobileImgUrl : this.hiResImgUrl;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (event.target.innerWidth <= 576 && !!this.mobileImgUrl) {
      this.bgImgSrc = this.mobileImgUrl;
    } else {
      this.bgImgSrc = this.activeImgSrc;
    }
  }

  get isMaxMD() {
    return window.innerWidth <= 576;
  }

  set bgImgSrc(src: string) {
    if (this._bgImgSrc !== src) {
      this._bgImgSrc = `url(${src})`;
    }
  }

  get bgImgSrc(): string {
    return this._bgImgSrc;
  }
}
