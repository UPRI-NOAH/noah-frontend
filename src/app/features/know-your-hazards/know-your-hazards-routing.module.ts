import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { KnowYourHazardsComponent } from './pages/know-your-hazards/know-your-hazards.component';

const routes: Routes = [
  {
    path: '',
    component: KnowYourHazardsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KnowYourHazardsRoutingModule {}
