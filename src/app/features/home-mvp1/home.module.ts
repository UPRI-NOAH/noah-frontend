import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { NavigationComponent } from './pages/navigation/navigation.component';
import { FooterComponent } from './pages/footer/footer.component';
import { PersonalizedRiskAssessmentModule } from '@features/personalized-risk-assessment/personalized-risk-assessment.module';
import { PlaygroundModule } from '@features/playground/playground.module';

@NgModule({
  declarations: [LandingPageComponent, NavigationComponent, FooterComponent],
  imports: [
    CommonModule,
    HomeRoutingModule,
    PersonalizedRiskAssessmentModule,
    PlaygroundModule,
  ],
})
export class HomeModule {}
