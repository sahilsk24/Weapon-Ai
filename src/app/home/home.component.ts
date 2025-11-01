import { Component ,HostListener} from '@angular/core';
// import { NavComponent } from "../nav/nav.component";
import { ContactUsComponent } from "../contact-us/contact-us.component";

import { DetectComponent } from "../detect/detect.component";

@Component({
  selector: 'app-home',
  imports: [DetectComponent, ContactUsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
 
  

}
