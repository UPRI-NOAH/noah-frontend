import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';

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
});
