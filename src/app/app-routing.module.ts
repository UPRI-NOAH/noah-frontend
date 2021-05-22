import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@features/home/home.module').then((m) => m.HomeModule),
  },
  {
    path: 'personal',
    loadChildren: () =>
      import(
        '@features/personalized-risk-assessment/personalized-risk-assessment.module'
      ).then((m) => m.PersonalizedRiskAssessmentModule),
  },
  {
    path: 'playground',
    loadChildren: () =>
      import('@features/playground/playground.module').then(
        (m) => m.PlaygroundModule
      ),
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
