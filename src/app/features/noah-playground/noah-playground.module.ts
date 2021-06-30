import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NoahPlaygroundRoutingModule } from './noah-playground-routing.module';
import { SharedModule } from '@shared/shared.module';

import { NoahPlaygroundComponent } from './pages/noah-playground/noah-playground.component';
import { FloodPlaygroundComponent } from './components/flood-playground/flood-playground.component';
import { LandslidePlaygroundComponent } from './components/landslide-playground/landslide-playground.component';
import { StormSurgePlaygroundComponent } from './components/storm-surge-playground/storm-surge-playground.component';
import { CriticalFacilitiesPlaygroundComponent } from './components/critical-facilities-playground/critical-facilities-playground.component';
import { MapPlaygroundComponent } from './components/map-playground/map-playground.component';
import { SearchPlaygroundComponent } from './components/search-playground/search-playground.component';

@NgModule({
  declarations: [
    NoahPlaygroundComponent,
    FloodPlaygroundComponent,
    LandslidePlaygroundComponent,
    StormSurgePlaygroundComponent,
    CriticalFacilitiesPlaygroundComponent,
    MapPlaygroundComponent,
    SearchPlaygroundComponent,
  ],
  imports: [CommonModule, NoahPlaygroundRoutingModule, SharedModule],
})
export class NoahPlaygroundModule {}
