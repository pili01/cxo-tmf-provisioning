import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.html',
  styleUrl: './preview.scss'
})
export class Preview {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/']);
  }
}
