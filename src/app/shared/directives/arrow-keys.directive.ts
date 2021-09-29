import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';

@Directive({
  selector: '[noahArrowKeys]',
})
export class ArrowKeysDirective {
  constructor(
    private kyhService: KyhService,
    public element: ElementRef,
    private render: Renderer2
  ) {
    this.render.setAttribute(this.element.nativeElement, 'tabindex', '0');
  }

  @HostListener('keydown', ['$event']) onKeyup(e: KeyboardEvent) {
    console.log(this.element);
    switch (e.code) {
      case 'ArrowUp':
        this.kyhService.sendMessage({ element: this.element, action: 'UP' });
        e.preventDefault();
        break;
      case 'ArrowDown':
        this.kyhService.sendMessage({ element: this.element, action: 'DOWN' });
        e.preventDefault();
        break;
      case 'Enter':
        this.kyhService.sendMessage({ element: this.element, action: 'ENTER' });
        break;
    }
  }
}
