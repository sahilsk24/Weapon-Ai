import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.css']
})
export class ContactUsComponent {
  form = { email: '', subject: 'improve', message: '' };

  constructor(private http: HttpClient) {}

  submitComplaint() {
    const apiUrl = 'https://offertorial-ovally-manie.ngrok-free.dev/complaints';

    // 🔹 Add ngrok-skip-browser-warning header
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    });

    this.http.post(apiUrl, this.form, { 
      headers: headers,
      withCredentials: true  // Match backend's supports_credentials
    }).subscribe({
      next: () => {
        alert('Form submitted successfully!');
        this.form = { email: '', subject: 'improve', message: '' };
      },
      error: (err) => {
        console.error('Submission failed:', err);
        alert('Failed to submit Form. Please try again.');
      }
    });
  }
}