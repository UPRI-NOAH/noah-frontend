import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PersonalizedRiskAssessmentRoutingModule } from './personalized-risk-assessment-routing.module';
import { BaseComponent } from './components/base/base.component';
import { FloodComponent } from './components/flood/flood.component';
import { LandslideComponent } from './components/landslide/landslide.component';
import { StormSurgeComponent } from './components/storm-surge/storm-surge.component';
import { CriticalFacilitiesComponent } from './components/critical-facilities/critical-facilities.component';

@NgModule({
  declarations: [
    BaseComponent,
    FloodComponent,
    LandslideComponent,
    StormSurgeComponent,
    CriticalFacilitiesComponent,
  ],
  imports: [CommonModule, PersonalizedRiskAssessmentRoutingModule],
})
export class PersonalizedRiskAssessmentModule {}
