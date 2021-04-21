import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BaseComponent } from './components/base/base.component';
import { FloodComponent } from './components/flood/flood.component';

const routes: Routes = [
  {
    path: 'base',
    component: BaseComponent,
  },
  {
    path: 'flood',
    component: FloodComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PersonalizedRiskAssessmentRoutingModule {}
