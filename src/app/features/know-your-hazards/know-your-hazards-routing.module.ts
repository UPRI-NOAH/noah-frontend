import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BibliographyComponent } from '@features/home/pages/bibliography/bibliography.component';
import { BaseComponent } from './pages/base/base.component';
import { FloodComponent } from './pages/flood/flood.component';
import { KnowYourHazardsComponent } from './pages/know-your-hazards/know-your-hazards.component';
import { LandslidesComponent } from './pages/landslides/landslides.component';
import { StormSurgeComponent } from './pages/storm-surge/storm-surge.component';

const routes: Routes = [
  {
    path: '',
    component: KnowYourHazardsComponent,
    children: [
      {
        path: 'flood',
        component: FloodComponent,
      },
      {
        path: 'landslide',
        component: LandslidesComponent,
      },
      {
        path: 'storm-surge',
        component: StormSurgeComponent,
      },
      {
        path: 'bibliography',
        component: BibliographyComponent,
      },
      {
        path: '',
        component: BaseComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KnowYourHazardsRoutingModule {}
