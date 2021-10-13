import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'know-your-hazards',
    loadChildren: () =>
      import('@features/know-your-hazards/know-your-hazards.module').then(
        (m) => m.KnowYourHazardsModule
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
