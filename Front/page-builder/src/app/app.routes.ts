import { Routes } from '@angular/router';
import { Home } from './components/home';
import { TemplateSelector } from './components/template-selector';
import { TemplateForm } from './components/template-form';
import { Preview } from './components/preview';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'templates/:categoryId', component: TemplateSelector },
  { path: 'build/:categoryId/:templateId', component: TemplateForm },
  { path: 'preview', component: Preview },
  { path: '**', redirectTo: '' }
];
