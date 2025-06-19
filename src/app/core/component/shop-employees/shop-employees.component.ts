import { Component, Input, OnInit } from '@angular/core';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-shop-employees',
  templateUrl: './shop-employees.component.html',
  styleUrls: ['./shop-employees.component.scss']
})
export class ShopEmployeesComponent implements OnInit {
  @Input() me: any = {}; // Le boss connecté

  employees: any[] = [];
  newEmployee: any = { email: '', firstname: '', lastname: '' };
  loading: boolean = false;
  feedbackMessage = '';
  isSubmitting = false;

  constructor(private userService: UserService) { }

  ngOnInit() {
    this.fetchEmployees();
  }

addEmployee() {
  if (!this.newEmployee.email || !this.newEmployee.firstname || !this.newEmployee.lastname) {
    this.feedbackMessage = "Tous les champs sont obligatoires.";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(this.newEmployee.email)) {
    this.feedbackMessage = "Email invalide.";
    return;
  }

  this.isSubmitting = true;
  this.feedbackMessage = '';

  this.userService.createAndAddEmployeeToBoss(this.newEmployee).subscribe({
    next: (createdUser: any) => {
      this.employees.push(createdUser.employee);
      this.newEmployee = { email: '', firstname: '', lastname: '' };
      this.feedbackMessage = "Employé ajouté avec succès.";
      this.isSubmitting = false;
    },
    error: (err) => {
      this.feedbackMessage = err?.error?.message || "Erreur lors de l'ajout de l'employé.";
      this.isSubmitting = false;
    }
  });
}

  fetchEmployees() {
    this.loading = true;
    this.userService.getMyEmployees().subscribe({
      next: (users: any[]) => {
        this.employees = users;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }  

  removeEmployee(employeeId: string) {
    this.userService.removeEmployeeFromBoss(employeeId).subscribe({
      next: () => {
        this.employees = this.employees.filter(e => e._id !== employeeId);
      },
      error: (err) => console.error('Erreur suppression employé :', err)
    });
  }
  
}