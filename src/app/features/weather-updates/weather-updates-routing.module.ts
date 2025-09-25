import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WeatherUpdatesComponent } from './pages/weather-updates/weather-updates.component';
import { TyphoonTrackGroupComponent } from './components/typhoon-track-group/typhoon-track-group.component';

const routes: Routes = [
  {
    path: '',
    component: WeatherUpdatesComponent,
    children: [
      {
        path: 'rainfall-contour',
        component: WeatherUpdatesComponent,
      },
      {
        path: 'typhoon-track',
        component: TyphoonTrackGroupComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WeatherUpdatesRoutingModule {}
