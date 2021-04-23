import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// MODULES
import { PersonalizedRiskAssessmentRoutingModule } from './personalized-risk-assessment-routing.module';

// PAGES / CONTAINERS
import { PersonalRiskComponent } from './pages/personal-risk/personal-risk.component';

// COMPONENTS
import { BaseComponent } from './components/base/base.component';
import { FloodComponent } from './components/flood/flood.component';
import { LandslideComponent } from './components/landslide/landslide.component';
import { StormSurgeComponent } from './components/storm-surge/storm-surge.component';
import { CriticalFacilitiesComponent } from './components/critical-facilities/critical-facilities.component';
import { PraMapComponent } from './components/pra-map/pra-map.component';
import { PraNavComponent } from './components/pra-nav/pra-nav.component';

@NgModule({
  declarations: [
    PersonalRiskComponent,
    BaseComponent,
    FloodComponent,
    LandslideComponent,
    StormSurgeComponent,
    CriticalFacilitiesComponent,
    PraMapComponent,
    PraNavComponent,
  ],
  imports: [CommonModule, PersonalizedRiskAssessmentRoutingModule],
})
export class PersonalizedRiskAssessmentModule {}
