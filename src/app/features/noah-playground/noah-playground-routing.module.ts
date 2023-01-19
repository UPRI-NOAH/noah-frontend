import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NoahPlaygroundComponent } from './pages/noah-playground/noah-playground.component';

const routes: Routes = [
  {
    path: '',
    component: NoahPlaygroundComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NoahPlaygroundRoutingModule {}
