import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TemplateService } from '../services/template';
import { TemplateCategory } from '../models/template.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  categories: TemplateCategory[];

  constructor(
    private templateService: TemplateService,
    private router: Router
  ) {
    this.categories = this.templateService.getCategories();
  }

  navigateToCategory(categoryId: string): void {
    this.router.navigate(['/templates', categoryId]);
  }
}
