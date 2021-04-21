import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { NavigationComponent } from './pages/navigation/navigation.component';
import { FooterComponent } from './pages/footer/footer.component';
import { BaseComponent } from '@features/personalized-risk-assessment/components/base/base.component';

@NgModule({
  declarations: [
    LandingPageComponent,
    NavigationComponent,
    FooterComponent,
    BaseComponent,
  ],
  imports: [CommonModule, HomeRoutingModule],
})
export class HomeModule {}
