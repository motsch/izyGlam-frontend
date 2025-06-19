import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss'
})
export class SubscriptionComponent implements OnInit {
  me: any = null;
  subscription: any = null;

  constructor(
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.userService.getMe().subscribe({
      next: (user: any) => {
        this.me = user;

        this.userService.getSubscription().subscribe({
          next: (sub: any) => {
            this.subscription = sub;
          }
        });
      }
    });
  }

  onSubscribe(plan: string, durationInMonths: number) {
    this.userService.subscribeToPlan(plan, durationInMonths).subscribe({
      next: (response) => {
        alert(response.message);
        this.ngOnInit(); // recharge les infos
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

}
