import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { NavigationComponent } from './pages/navigation/navigation.component';
import { FooterComponent } from './pages/footer/footer.component';
import { MapComponent } from './pages/map/map.component';

@NgModule({
  declarations: [
    LandingPageComponent,
    NavigationComponent,
    FooterComponent,
    MapComponent,
  ],
  imports: [CommonModule, HomeRoutingModule],
})
export class HomeModule {}
