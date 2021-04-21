import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BaseComponent } from '@features/personalized-risk-assessment/components/base/base.component';
import { PlaygroundComponent } from '@features/playground/playground.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';

const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
  },
  {
    path: 'base',
    component: BaseComponent,
  },
  {
    path: 'playground',
    component: PlaygroundComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
