import { Component, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-rating-modal',
  templateUrl: './rating-modal.component.html',
  styleUrl: './rating-modal.component.scss'
})
export class RatingModalComponent {
  rating: number = 5;
  comment: string = '';
  stars = [5,4,3,2,1];

  constructor(public dialogRef: MatDialogRef<RatingModalComponent>) {}

  closeDialog() {
    this.dialogRef.close();
  }

  submitReview() {
    const review = {
      rating: this.rating,
      comment: this.comment,
    };
    this.dialogRef.close(review);
  }
}