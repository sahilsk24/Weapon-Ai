import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DetectService } from '../services/detect.service';

@Component({
  selector: 'app-detect',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detect.component.html',
  styleUrls: ['./detect.component.css']
})
export class DetectComponent {
  // -------- Image Upload Detection --------
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  resultUrl: string | null = null;
  loading = false;

  // -------- Live Camera Detection --------
  videoUrl = '';
  cameraActive = false;
  detectionMessage = '';
  detectedImages: string[] = [];

  constructor(private detectService: DetectService, private http: HttpClient) {}

  // ==================== IMAGE UPLOAD ====================
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result as string;
      reader.readAsDataURL(this.selectedFile);
    }
  }
uploadImage(): void {
  if (!this.selectedFile) {
    alert('Please select an image first!');
    return;
  }

  this.loading = true;
  this.detectService.uploadImage(this.selectedFile).subscribe({
    next: (blob) => {
      this.resultUrl = URL.createObjectURL(blob);
      this.loading = false;
    },
    error: (err) => {
      console.error('Upload failed:', err);
      alert('Something went wrong with detection');
      this.loading = false;
    }
  });
}

  // ==================== LIVE DETECTION ====================
  // startCamera(): void {
  //   this.http.post('http://localhost:5000/start_camera', {}).subscribe(() => {
  //     this.videoUrl = 'http://localhost:5000/video_feed';
  //     this.cameraActive = true;
  //     this.detectionMessage = 'Camera is running...';
  //     this.loadDetectedImages();
  //   });
  // }

  // stopCamera(): void {
  //   this.http.post('http://localhost:5000/stop_camera', {}).subscribe(() => {
  //     this.cameraActive = false;
  //     this.videoUrl = '';
  //     this.detectionMessage = 'Camera stopped.';
  //   });
  // }

  // loadDetectedImages(): void {
  //   this.http.get<{ images: string[] }>('http://localhost:5000/get_detected_images')
  //     .subscribe(data => {
  //       this.detectedImages = data.images;
  //     });
  // }

liveInterval: any;
stream: MediaStream | null = null;
async startLive() {
  const video = document.getElementById('cam') as HTMLVideoElement;
  this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = this.stream;

  this.liveInterval = setInterval(() => this.sendFrame(), 200);
}

stopLive() {
  clearInterval(this.liveInterval);

  // ✅ Stop Webcam Stream
  const video = document.getElementById('cam') as HTMLVideoElement;
  if (this.stream) {
    this.stream.getTracks().forEach(track => track.stop());
  }

  // ✅ Clear video feed
  video.srcObject = null;
  
  // ✅ Clear detected image
  (document.getElementById('detected') as HTMLImageElement).src = '';
}


// async startLive() {
//   const video = document.getElementById('cam') as HTMLVideoElement;
//   const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//   video.srcObject = stream;

//   this.liveInterval = setInterval(() => this.sendFrame(), 200);
// }

// stopLive() {
//   clearInterval(this.liveInterval);
// }

sendFrame() {
  const video = document.getElementById('cam') as HTMLVideoElement;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  canvas.getContext('2d')?.drawImage(video, 0, 0);
  canvas.toBlob((blob) => {
    const formData = new FormData();
    formData.append('frame', blob!, 'frame.jpg');

   this.http.post('https://offertorial-ovally-manie.ngrok-free.dev/live_detect', formData, { responseType: 'blob' })

      .subscribe(res => {
        const imgURL = URL.createObjectURL(res);
        (document.getElementById('detected') as HTMLImageElement).src = imgURL;
      });
  }, 'image/jpeg');
}

}
