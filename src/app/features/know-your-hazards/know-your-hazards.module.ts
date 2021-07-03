import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// MODULES
import { KnowYourHazardsRoutingModule } from './know-your-hazards-routing.module';

// PAGES
import { KnowYourHazardsComponent } from './pages/know-your-hazards/know-your-hazards.component';

// COMPONENTS
import { CriticalFacilitiesKyhComponent } from './components/critical-facilities-kyh/critical-facilities-kyh.component';
import { FloodInfoComponent } from './components/flood-info/flood-info.component';
import { FloodKyhComponent } from './components/flood-kyh/flood-kyh.component';
import { LandslideInfoComponent } from './components/landslide-info/landslide-info.component';
import { LandslideKyhComponent } from './components/landslide-kyh/landslide-kyh.component';
import { MapKyhComponent } from './components/map-kyh/map-kyh.component';
import { StormSurgeInfoComponent } from './components/storm-surge-info/storm-surge-info.component';
import { StormSurgeKyhComponent } from './components/storm-surge-kyh/storm-surge-kyh.component';
import { SearchComponent } from './components/search/search.component';
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [
    KnowYourHazardsComponent,
    CriticalFacilitiesKyhComponent,
    FloodInfoComponent,
    FloodKyhComponent,
    LandslideInfoComponent,
    LandslideKyhComponent,
    MapKyhComponent,
    StormSurgeInfoComponent,
    StormSurgeKyhComponent,
    SearchComponent,
  ],
  imports: [CommonModule, KnowYourHazardsRoutingModule, SharedModule],
})
export class KnowYourHazardsModule {}
