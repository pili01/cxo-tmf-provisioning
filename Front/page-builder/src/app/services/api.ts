import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../models/environment';
import { DeployRequest, DeployResponse } from '../models/template.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  deploy(request: DeployRequest): Observable<DeployResponse> {
    return this.http.post<DeployResponse>(`${this.baseUrl}/pages/deploy`, request);
  }
}
