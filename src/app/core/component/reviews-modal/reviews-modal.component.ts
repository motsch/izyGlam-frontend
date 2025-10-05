import { Component } from '@angular/core';
import { ReviewsModalService } from '../../services/reviews-modal.service';

@Component({
  selector: 'app-reviews-modal',
  templateUrl: './reviews-modal.component.html',
  styleUrls: ['./reviews-modal.component.scss'],
})
export class ReviewsModalComponent {
  constructor(public modal: ReviewsModalService) {}

  closeBackdrop(e: MouseEvent) {
    e.stopPropagation();
    this.modal.close();
  }

  stop(e: MouseEvent) { e.stopPropagation(); }
}
