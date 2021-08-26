import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import { UP_ARROW, DOWN_ARROW, ENTER } from '@angular/cdk/keycodes';
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

  @HostListener('keydown', ['$event']) onKeyup(e) {
    switch (e.keyCode) {
      case UP_ARROW:
        this.kyhService.sendMessage({ element: this.element, action: 'UP' });
        e.preventDefault();
        break;
      case DOWN_ARROW:
        this.kyhService.sendMessage({ element: this.element, action: 'DOWN' });
        e.preventDefault();
        break;
      case ENTER:
        this.kyhService.sendMessage({ element: this.element, action: 'ENTER' });
        break;
    }
  }
}
