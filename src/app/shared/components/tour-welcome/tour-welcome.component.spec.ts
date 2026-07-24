import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';

import { TourWelcomeComponent } from './tour-welcome.component';

describe('TourWelcomeComponent', () => {
  let component: TourWelcomeComponent;
  let fixture: ComponentFixture<TourWelcomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TourWelcomeComponent],
      imports: [CommonModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TourWelcomeComponent);
    component = fixture.componentInstance;
    component.content = {
      title: 'Welcome to',
      accentTitle: 'NOAH Studio',
      text: 'Explore hazard maps.',
      prompt: 'Take a quick tour.',
      brandLabel: 'STUDIO',
      logoUrl: 'assets/icons/logo-noah.svg',
      logoAlt: 'Project NOAH',
      imageUrl: 'assets/images/tour/noah-studio-welcome-image.svg',
      imageAlt: 'NOAH Studio map preview',
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the configured welcome content', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(
      element.querySelector('.tour-welcome__brand-label')?.textContent
    ).toContain('STUDIO');
    expect(
      element.querySelector('.tour-welcome__title')?.textContent
    ).toContain('Welcome to');
    expect(
      element.querySelector('.tour-welcome__title-accent')?.textContent
    ).toContain('NOAH Studio');
    expect(
      element.querySelector('.tour-welcome__prompt')?.textContent
    ).toContain('Take a quick tour.');
    expect(
      element.querySelector<HTMLImageElement>('.tour-welcome__logo')?.alt
    ).toBe('Project NOAH');
    expect(
      element.querySelector<HTMLImageElement>('.tour-welcome__image')?.src
    ).toContain('noah-studio-welcome-image.svg');
  });

  it('emits start and close from the primary actions', () => {
    spyOn(component.start, 'emit');
    spyOn(component.close, 'emit');
    const element: HTMLElement = fixture.nativeElement;

    element.querySelector<HTMLButtonElement>('.tour-welcome__start')?.click();
    element.querySelector<HTMLButtonElement>('.tour-welcome__skip')?.click();

    expect(component.start.emit).toHaveBeenCalled();
    expect(component.close.emit).toHaveBeenCalled();
  });
});
