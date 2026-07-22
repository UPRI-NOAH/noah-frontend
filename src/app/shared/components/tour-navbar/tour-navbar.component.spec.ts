import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { SimpleChange } from '@angular/core';

import { TourNavbarComponent } from './tour-navbar.component';

describe('TourNavbarComponent', () => {
  let component: TourNavbarComponent;
  let fixture: ComponentFixture<TourNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TourNavbarComponent],
      imports: [CommonModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TourNavbarComponent);
    component = fixture.componentInstance;
    component.sections = [
      { id: 'one', label: 'One', steps: [] },
      { id: 'two', label: 'Two', steps: [] },
    ];
    component.activeSectionId = 'one';
    fixture.detectChanges();
  });

  it('marks the active section and emits selections', () => {
    spyOn(component.sectionSelected, 'emit');
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    );

    expect(buttons[0].getAttribute('aria-current')).toBe('step');

    buttons[1].click();

    expect(component.sectionSelected.emit).toHaveBeenCalledWith('two');
  });

  it('reveals an active section clipped on the right', fakeAsync(() => {
    const navbar = fixture.nativeElement.querySelector('nav') as HTMLElement;
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];
    spyOn(navbar, 'getBoundingClientRect').and.returnValue(
      new DOMRect(0, 0, 100, 34)
    );
    spyOn(buttons[1], 'getBoundingClientRect').and.returnValue(
      new DOMRect(120, 0, 80, 34)
    );
    const scrollToSpy = spyOn(navbar, 'scrollTo') as jasmine.Spy;

    component.activeSectionId = 'two';
    component.ngOnChanges({
      activeSectionId: new SimpleChange('one', 'two', false),
    });
    fixture.detectChanges();
    tick(16);

    expect(scrollToSpy).toHaveBeenCalledWith({
      left: 100,
      behavior: 'smooth',
    });
  }));

  it('reveals an active section clipped on the left', fakeAsync(() => {
    const navbar = fixture.nativeElement.querySelector('nav') as HTMLElement;
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];
    Object.defineProperty(navbar, 'scrollLeft', {
      configurable: true,
      value: 120,
      writable: true,
    });
    spyOn(navbar, 'getBoundingClientRect').and.returnValue(
      new DOMRect(0, 0, 100, 34)
    );
    spyOn(buttons[0], 'getBoundingClientRect').and.returnValue(
      new DOMRect(-40, 0, 80, 34)
    );
    const scrollToSpy = spyOn(navbar, 'scrollTo') as jasmine.Spy;

    component.activeSectionId = 'one';
    component.ngOnChanges({
      activeSectionId: new SimpleChange('two', 'one', false),
    });
    fixture.detectChanges();
    tick(16);

    expect(scrollToSpy).toHaveBeenCalledWith({
      left: 80,
      behavior: 'smooth',
    });
  }));

  it('does not scroll when the active section is fully visible', fakeAsync(() => {
    const navbar = fixture.nativeElement.querySelector('nav') as HTMLElement;
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];
    spyOn(navbar, 'getBoundingClientRect').and.returnValue(
      new DOMRect(0, 0, 200, 34)
    );
    spyOn(buttons[0], 'getBoundingClientRect').and.returnValue(
      new DOMRect(20, 0, 80, 34)
    );
    const scrollToSpy = spyOn(navbar, 'scrollTo') as jasmine.Spy;

    tick(16);

    expect(scrollToSpy).not.toHaveBeenCalled();
  }));

  it('reveals the initial active section after rendering', fakeAsync(() => {
    const navbar = fixture.nativeElement.querySelector('nav') as HTMLElement;
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];
    spyOn(navbar, 'getBoundingClientRect').and.returnValue(
      new DOMRect(0, 0, 100, 34)
    );
    spyOn(buttons[0], 'getBoundingClientRect').and.returnValue(
      new DOMRect(110, 0, 80, 34)
    );
    const scrollToSpy = spyOn(navbar, 'scrollTo') as jasmine.Spy;

    tick(16);

    expect(scrollToSpy).toHaveBeenCalledWith({
      left: 90,
      behavior: 'smooth',
    });
  }));

  it('uses instant scrolling when reduced motion is preferred', fakeAsync(() => {
    const navbar = fixture.nativeElement.querySelector('nav') as HTMLElement;
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];
    spyOn(navbar, 'getBoundingClientRect').and.returnValue(
      new DOMRect(0, 0, 100, 34)
    );
    spyOn(buttons[1], 'getBoundingClientRect').and.returnValue(
      new DOMRect(120, 0, 80, 34)
    );
    spyOn(window, 'matchMedia').and.returnValue({
      matches: true,
    } as MediaQueryList);
    const scrollToSpy = spyOn(navbar, 'scrollTo') as jasmine.Spy;

    component.activeSectionId = 'two';
    component.ngOnChanges({
      activeSectionId: new SimpleChange('one', 'two', false),
    });
    fixture.detectChanges();
    tick(16);

    expect(scrollToSpy).toHaveBeenCalledWith({
      left: 100,
      behavior: 'auto',
    });
  }));
});
