import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { FooterComponent } from './components/footer/footer.component';
import { PersonalizedRiskAssessmentModule } from '@features/personalized-risk-assessment/personalized-risk-assessment.module';
import { PlaygroundModule } from '@features/playground/playground.module';
import { KnowYourHazardsModule } from '@features/know-your-hazards/know-your-hazards.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [LandingPageComponent, NavigationComponent, FooterComponent],
  imports: [
    CommonModule,
    HomeRoutingModule,
    PersonalizedRiskAssessmentModule,
    PlaygroundModule,
    KnowYourHazardsModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class HomeModule {}
