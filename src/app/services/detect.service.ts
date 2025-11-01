import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DetectService {

  private apiUrl = 'https://offertorial-ovally-manie.ngrok-free.dev/upload';

  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<Blob> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post(this.apiUrl, formData, {
      responseType: 'blob'
    });
  }
}
