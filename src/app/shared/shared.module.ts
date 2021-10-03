import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SearchComponent } from './components/search/search.component';
import { ArrowKeysDirective } from './arrow-keys.directive';
import { BannerComponent } from './components/banner/banner.component';

const modules = [CommonModule, FormsModule, ReactiveFormsModule];
const components = [SearchComponent, BannerComponent];
const directives = [];
@NgModule({
  declarations: [...components, ...directives],
  imports: [...modules],
  exports: [...modules, ...components, ...directives],
})
export class SharedModule {}
