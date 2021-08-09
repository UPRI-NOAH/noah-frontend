import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NoahPlaygroundRoutingModule } from './noah-playground-routing.module';
import { SharedModule } from '@shared/shared.module';

import { NoahPlaygroundComponent } from './pages/noah-playground/noah-playground.component';
import { CriticalFacilitiesPlaygroundComponent } from './components/critical-facilities-playground/critical-facilities-playground.component';
import { MapPlaygroundComponent } from './components/map-playground/map-playground.component';
import { SliderComponent } from './components/slider/slider.component';
import { HazardLegendComponent } from './components/hazard-legend/hazard-legend.component';
import { HazardLevelComponent } from './components/hazard-level/hazard-level.component';
import { HazardTypeComponent } from './components/hazard-type/hazard-type.component';
import { ExaggerationComponent } from './components/exaggeration/exaggeration.component';
import { FacilityComponent } from './components/facility/facility.component';

@NgModule({
  declarations: [
    NoahPlaygroundComponent,
    CriticalFacilitiesPlaygroundComponent,
    MapPlaygroundComponent,
    SliderComponent,
    HazardLegendComponent,
    HazardLevelComponent,
    HazardTypeComponent,
    ExaggerationComponent,
    FacilityComponent,
  ],
  imports: [CommonModule, NoahPlaygroundRoutingModule, SharedModule],
})
export class NoahPlaygroundModule {}
