import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// MODULES
import { KnowYourHazardsRoutingModule } from './know-your-hazards-routing.module';
// PAGES
import { KnowYourHazardsComponent } from './pages/know-your-hazards/know-your-hazards.component';

@NgModule({
  declarations: [KnowYourHazardsComponent],
  imports: [CommonModule, KnowYourHazardsRoutingModule],
})
export class KnowYourHazardsModule {}
