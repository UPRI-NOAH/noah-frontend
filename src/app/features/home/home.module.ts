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
import { SharedModule } from '@shared/shared.module';
import { BibliographyComponent } from './pages/bibliography/bibliography.component';

@NgModule({
  declarations: [
    LandingPageComponent,
    NavigationComponent,
    FooterComponent,
    BibliographyComponent,
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    PersonalizedRiskAssessmentModule,
    PlaygroundModule,
    KnowYourHazardsModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
  ],
})
export class HomeModule {}
