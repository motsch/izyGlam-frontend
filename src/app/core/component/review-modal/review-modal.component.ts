import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ShopService } from '../../services/shop.service';
import { result } from 'lodash';

@Component({
  selector: 'app-review-modal',
  templateUrl: './review-modal.component.html',
  styleUrl: './review-modal.component.scss'
})
export class ReviewModalComponent implements OnInit, OnDestroy {
  @Input() booking: any;
  @Output() closeModal = new EventEmitter<void>();

  rating: number = 5;
  reviewText: string = '';
  message: string = '';
  photos: string[] = [];
  constructor(private shopService: ShopService) { }
  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.shopService.getById(this.booking.shopId).subscribe((result: any) => {
      console.log("SHOP FOR REVIEW: "+ JSON.stringify(result));
    }, (error: any) => {
      console.log(error);
    })
  }

  ngOnDestroy() {
    document.body.style.overflow = 'auto';
  }
  onRatingChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.rating = +input.value;
  }

  triggerFileInput() {
    const input = document.querySelector<HTMLInputElement>('#fileInput');
    input?.click();
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        this.photos.push(reader.result as string);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  removePhoto(index: number) {
    this.photos.splice(index, 1);
  }

  submitReview() {
    console.log({ rating: this.rating, reviewText: this.reviewText, message: this.message, photos: this.photos });






    this.close();
  }

  close() {
    this.closeModal.emit();
  }
}
