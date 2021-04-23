import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BaseComponent } from './components/base/base.component';
import { CriticalFacilitiesComponent } from './components/critical-facilities/critical-facilities.component';
import { FloodComponent } from './components/flood/flood.component';
import { LandslideComponent } from './components/landslide/landslide.component';
import { StormSurgeComponent } from './components/storm-surge/storm-surge.component';
import { PersonalRiskComponent } from './pages/personal-risk/personal-risk.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'base',
    pathMatch: 'full',
  },
  {
    path: '',
    component: PersonalRiskComponent,
    children: [
      {
        path: 'base',
        component: BaseComponent,
      },
      {
        path: 'flood',
        component: FloodComponent,
      },
      {
        path: 'landslide',
        component: LandslideComponent,
      },
      {
        path: 'storm-surge',
        component: StormSurgeComponent,
      },
      {
        path: 'critical-facilities',
        component: CriticalFacilitiesComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PersonalizedRiskAssessmentRoutingModule {}
