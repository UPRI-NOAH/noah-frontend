import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'mvp1',
    loadChildren: () =>
      import('@features/home-mvp1/home.module').then((m) => m.HomeModule),
  },
  {
    path: 'personal',
    loadChildren: () =>
      import(
        '@features/personalized-risk-assessment/personalized-risk-assessment.module'
      ).then((m) => m.PersonalizedRiskAssessmentModule),
  },
  {
    path: 'know-your-hazards',
    loadChildren: () =>
      import('@features/know-your-hazards/know-your-hazards.module').then(
        (m) => m.KnowYourHazardsModule
      ),
  },
  {
    path: 'playground',
    loadChildren: () =>
      import('@features/playground/playground.module').then(
        (m) => m.PlaygroundModule
      ),
  },
  {
    path: '',
    loadChildren: () =>
      import('@features/home/home.module').then((m) => m.HomeModule),
  },
  {
    path: 'noah-studio',
    loadChildren: () =>
      import('@features/noah-playground/noah-playground.module').then(
        (m) => m.NoahPlaygroundModule
      ),
  },
  {
    path: 'noah-playground',
    redirectTo: 'noah-studio',
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
