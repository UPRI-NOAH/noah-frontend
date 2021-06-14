import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlaygroundRoutingModule } from './playground-routing.module';
import { SharedModule } from '@shared/shared.module';

import { PlaygroundComponent } from './pages/playground/playground.component';
import { FloodPlaygroundComponent } from './components/flood-playground/flood-playground.component';
import { LandslidePlaygroundComponent } from './components/landslide-playground/landslide-playground.component';
import { StormSurgePlaygroundComponent } from './components/storm-surge-playground/storm-surge-playground.component';
import { CriticalFacilitiesPlaygroundComponent } from './components/critical-facilities-playground/critical-facilities-playground.component';
import { PlaygroundMapComponent } from './components/playground-map/playground-map.component';
import { SearchComponent } from './components/search/search.component';

@NgModule({
  declarations: [
    PlaygroundComponent,
    FloodPlaygroundComponent,
    LandslidePlaygroundComponent,
    StormSurgePlaygroundComponent,
    CriticalFacilitiesPlaygroundComponent,
    PlaygroundMapComponent,
    SearchComponent,
  ],
  imports: [CommonModule, PlaygroundRoutingModule, SharedModule],
})
export class PlaygroundModule {}
