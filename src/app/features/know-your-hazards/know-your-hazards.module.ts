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
import { SearchComponent } from './components/search/search.component';
import { SharedModule } from '@shared/shared.module';
import { SurvivalKitComponent } from './components/survival-kit/survival-kit.component';

@NgModule({
  declarations: [
    KnowYourHazardsComponent,
    CriticalFacilitiesKyhComponent,
    FloodKyhComponent,
    LandslideKyhComponent,
    MapKyhComponent,
    StormSurgeKyhComponent,
    SearchComponent,
    SurvivalKitComponent,
  ],
  imports: [CommonModule, KnowYourHazardsRoutingModule, SharedModule],
})
export class KnowYourHazardsModule {}
