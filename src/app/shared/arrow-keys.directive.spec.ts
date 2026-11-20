import { ElementRef, Renderer2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import { ArrowKeysDirective } from './arrow-keys.directive';

describe('ArrowKeysDirective', () => {
  it('should create an instance', () => {
    TestBed.configureTestingModule({
      providers: [
        ArrowKeysDirective,
        { provide: KyhService, useValue: { sendMessage: () => undefined } },
        {
          provide: ElementRef,
          useValue: { nativeElement: document.createElement('div') },
        },
        { provide: Renderer2, useValue: { setAttribute: () => undefined } },
      ],
    });

    const directive = TestBed.inject(ArrowKeysDirective);
    expect(directive).toBeTruthy();
  });
});
