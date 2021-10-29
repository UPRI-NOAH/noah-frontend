import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// MODULES
import { KnowYourHazardsRoutingModule } from './know-your-hazards-routing.module';

// PAGES
import { KnowYourHazardsComponent } from './pages/know-your-hazards/know-your-hazards.component';

// COMPONENTS
import { CriticalFacilitiesKyhComponent } from './components/critical-facilities-kyh/critical-facilities-kyh.component';
import { MapKyhComponent } from './components/map-kyh/map-kyh.component';
import { SharedModule } from '@shared/shared.module';
import { SurvivalKitComponent } from './components/survival-kit/survival-kit.component';
import { BaseComponent } from './pages/base/base.component';
import { FloodComponent } from './pages/flood/flood.component';
import { LandslidesComponent } from './pages/landslides/landslides.component';
import { StormSurgeComponent } from './pages/storm-surge/storm-surge.component';
import { HazardButtonComponent } from './components/hazard-button/hazard-button.component';

@NgModule({
  declarations: [
    KnowYourHazardsComponent,
    CriticalFacilitiesKyhComponent,
    MapKyhComponent,
    SurvivalKitComponent,
    BaseComponent,
    FloodComponent,
    LandslidesComponent,
    StormSurgeComponent,
    HazardButtonComponent,
  ],
  imports: [CommonModule, KnowYourHazardsRoutingModule, SharedModule],
})
export class KnowYourHazardsModule {}
