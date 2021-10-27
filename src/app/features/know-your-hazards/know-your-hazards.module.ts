import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// MODULES
import { KnowYourHazardsRoutingModule } from './know-your-hazards-routing.module';

// PAGES
import { KnowYourHazardsComponent } from './pages/know-your-hazards/know-your-hazards.component';

// COMPONENTS
import { CriticalFacilitiesKyhComponent } from './components/critical-facilities-kyh/critical-facilities-kyh.component';
import { FloodKyhComponent } from './components/flood-kyh/flood-kyh.component';
import { LandslideKyhComponent } from './components/landslide-kyh/landslide-kyh.component';
import { MapKyhComponent } from './components/map-kyh/map-kyh.component';
import { StormSurgeKyhComponent } from './components/storm-surge-kyh/storm-surge-kyh.component';
import { SharedModule } from '@shared/shared.module';
import { SurvivalKitComponent } from './components/survival-kit/survival-kit.component';
import { BaseComponent } from './pages/base/base.component';
import { FloodComponent } from './pages/flood/flood.component';
import { LandslidesComponent } from './pages/landslides/landslides.component';
import { StormSurgeComponent } from './pages/storm-surge/storm-surge.component';

@NgModule({
  declarations: [
    KnowYourHazardsComponent,
    CriticalFacilitiesKyhComponent,
    FloodKyhComponent,
    LandslideKyhComponent,
    MapKyhComponent,
    StormSurgeKyhComponent,
    SurvivalKitComponent,
    BaseComponent,
    FloodComponent,
    LandslidesComponent,
    StormSurgeComponent,
  ],
  imports: [CommonModule, KnowYourHazardsRoutingModule, SharedModule],
})
export class KnowYourHazardsModule {}
