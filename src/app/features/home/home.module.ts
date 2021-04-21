import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { NavigationComponent } from './pages/navigation/navigation.component';
import { FooterComponent } from './pages/footer/footer.component';
import { PersonalizedRiskAssessmentModule } from '@features/personalized-risk-assessment/personalized-risk-assessment.module';
import { PlaygroundComponent } from '@features/playground/playground.component';

@NgModule({
  declarations: [
    LandingPageComponent,
    NavigationComponent,
    FooterComponent,
    PlaygroundComponent,
  ],
  imports: [CommonModule, HomeRoutingModule, PersonalizedRiskAssessmentModule],
})
export class HomeModule {}
