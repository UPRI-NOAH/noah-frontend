import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FloodComponent } from './features/personalized-risk-assessment/components/flood/flood.component';
import { LandslideComponent } from './features/personalized-risk-assessment/components/landslide/landslide.component';
import { StormSurgeComponent } from './features/personalized-risk-assessment/components/storm-surge/storm-surge.component';
import { CriticalFacilitiesComponent } from './features/personalized-risk-assessment/components/critical-facilities/critical-facilities.component';
import { PlaygroundComponent } from './features/playground/playground.component';

@NgModule({
  declarations: [
    AppComponent,
    FloodComponent,
    LandslideComponent,
    StormSurgeComponent,
    CriticalFacilitiesComponent,
    PlaygroundComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, BrowserAnimationsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
