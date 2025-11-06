// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { HttpClient } from '@angular/common/http';
// import { DetectService } from '../services/detect.service';

// @Component({
//   selector: 'app-detect',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './detect.component.html',
//   styleUrls: ['./detect.component.css']
// })
// export class DetectComponent {
 
//   selectedFile: File | null = null;
//   previewUrl: string | null = null;
//   resultUrl: string | null = null;
//   loading = false;

//   videoUrl = '';
//   cameraActive = false;
//   detectionMessage = '';
//   detectedImages: string[] = [];

//   constructor(private detectService: DetectService, private http: HttpClient) {}

//   onFileSelected(event: any): void {
//     this.selectedFile = event.target.files[0];
//     if (this.selectedFile) {
//       const reader = new FileReader();
//       reader.onload = () => this.previewUrl = reader.result as string;
//       reader.readAsDataURL(this.selectedFile);
//     }
//   }
// uploadImage(): void {
//   if (!this.selectedFile) {
//     alert('Please select an image first!');
//     return;
//   }

//   this.loading = true;
//   this.detectService.uploadImage(this.selectedFile).subscribe({
//     next: (blob) => {
//       this.resultUrl = URL.createObjectURL(blob);
//       this.loading = false;
//     },
//     error: (err) => {
//       console.error('Upload failed:', err);
//       alert('Something went wrong with detection');
//       this.loading = false;
//     }
//   });
// }



// liveInterval: any;
// stream: MediaStream | null = null;
// async startLive() {
//   const video = document.getElementById('cam') as HTMLVideoElement;
//   this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
//   video.srcObject = this.stream;

//   this.liveInterval = setInterval(() => this.sendFrame(), 200);
// }

// stopLive() {
//   clearInterval(this.liveInterval);
//   const video = document.getElementById('cam') as HTMLVideoElement;
//   if (this.stream) {
//     this.stream.getTracks().forEach(track => track.stop());
//   }

//   video.srcObject = null;

//   (document.getElementById('detected') as HTMLImageElement).src = '';
// }


// sendFrame() {
//   const video = document.getElementById('cam') as HTMLVideoElement;
//   const canvas = document.createElement('canvas');
//   canvas.width = video.videoWidth;
//   canvas.height = video.videoHeight;

//   canvas.getContext('2d')?.drawImage(video, 0, 0);
//   canvas.toBlob((blob) => {
//     const formData = new FormData();
//     formData.append('frame', blob!, 'frame.jpg');

//    this.http.post('https://offertorial-ovally-manie.ngrok-free.dev/live_detect', formData, { responseType: 'blob' })

//       .subscribe(res => {
//         const imgURL = URL.createObjectURL(res);
//         (document.getElementById('detected') as HTMLImageElement).src = imgURL;
//       });
//   }, 'image/jpeg');
// }

// }

import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetectService } from '../services/detect.service';

@Component({
  selector: 'app-detect',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detect.component.html',
  styleUrls: ['./detect.component.css']
})
export class DetectComponent implements OnDestroy {
  // -------- Image Upload Detection --------
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  resultUrl: string | null = null;
  loading = false;

  // -------- Live Camera Detection --------
  liveInterval: any;
  stream: MediaStream | null = null;
  liveDetectionActive = false;
  cameraError = '';
  private lastFrameTime = 0;
  private readonly FRAME_INTERVAL = 300; // ms between frames
  private currentDetectedUrl: string | null = null;

  constructor(private detectService: DetectService) {}

  ngOnDestroy(): void {
    this.stopLive();
    this.cleanupUrls();
  }

  // ==================== IMAGE UPLOAD ====================
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }

    this.selectedFile = file;

    // Clean up previous preview URL
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.onerror = () => {
      alert('Error reading file');
    };
    reader.readAsDataURL(file);
  }

  uploadImage(): void {
    if (!this.selectedFile) {
      alert('Please select an image first!');
      return;
    }

    this.loading = true;

    // Clean up previous result URL
    if (this.resultUrl) {
      URL.revokeObjectURL(this.resultUrl);
      this.resultUrl = null;
    }

    this.detectService.uploadImage(this.selectedFile).subscribe({
      next: (blob) => {
        this.resultUrl = URL.createObjectURL(blob);
        this.loading = false;
      },
      error: (err) => {
        console.error('Upload failed:', err);
        alert('Failed to detect weapons. Please try again.');
        this.loading = false;
      }
    });
  }

  // ==================== LIVE DETECTION ====================
  async startLive(): Promise<void> {
    try {
      this.cameraError = '';
      const video = document.getElementById('cam') as HTMLVideoElement;

      if (!video) {
        throw new Error('Video element not found');
      }

      // Request camera access with specific constraints
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      video.srcObject = this.stream;

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play()
            .then(() => resolve())
            .catch(reject);
        };
        video.onerror = () => reject(new Error('Video loading failed'));
      });

      this.liveDetectionActive = true;
      this.lastFrameTime = 0;

      // Start sending frames
      this.liveInterval = setInterval(() => this.sendFrame(), this.FRAME_INTERVAL);

    } catch (error: any) {
      console.error('Camera access error:', error);
      this.cameraError = error.name === 'NotAllowedError' 
        ? 'Camera access denied. Please allow camera permissions.'
        : 'Could not access camera. Please check your device.';
      alert(this.cameraError);
      this.stopLive();
    }
  }

  stopLive(): void {
    // Clear interval
    if (this.liveInterval) {
      clearInterval(this.liveInterval);
      this.liveInterval = null;
    }

    // Stop webcam stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Clear video feed
    const video = document.getElementById('cam') as HTMLVideoElement;
    if (video) {
      video.srcObject = null;
    }

    // Clear detected image and revoke URL
    const detectedImg = document.getElementById('detected') as HTMLImageElement;
    if (detectedImg) {
      if (this.currentDetectedUrl) {
        URL.revokeObjectURL(this.currentDetectedUrl);
        this.currentDetectedUrl = null;
      }
      detectedImg.src = '';
    }

    this.liveDetectionActive = false;
    this.cameraError = '';
  }

  private sendFrame(): void {
    if (!this.liveDetectionActive) return;

    const now = Date.now();
    if (now - this.lastFrameTime < this.FRAME_INTERVAL) {
      return; // Throttle requests
    }
    this.lastFrameTime = now;

    const video = document.getElementById('cam') as HTMLVideoElement;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob || !this.liveDetectionActive) return;

      this.detectService.detectFrame(blob).subscribe({
        next: (res) => {
          if (!this.liveDetectionActive) return;

          const detectedImg = document.getElementById('detected') as HTMLImageElement;
          if (!detectedImg) return;

          // Revoke previous URL to prevent memory leak
          if (this.currentDetectedUrl) {
            URL.revokeObjectURL(this.currentDetectedUrl);
          }

          this.currentDetectedUrl = URL.createObjectURL(res);
          detectedImg.src = this.currentDetectedUrl;
        },
        error: (err) => {
          console.error('Detection failed:', err);
          // Don't show alert for every frame failure, just log it
        }
      });
    }, 'image/jpeg', 0.8); // 0.8 quality for smaller file size
  }

  private cleanupUrls(): void {
    if (this.previewUrl && this.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
    if (this.resultUrl) {
      URL.revokeObjectURL(this.resultUrl);
    }
    if (this.currentDetectedUrl) {
      URL.revokeObjectURL(this.currentDetectedUrl);
    }
  }
}