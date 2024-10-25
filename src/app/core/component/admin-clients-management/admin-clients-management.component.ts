import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-admin-clients-management',
  templateUrl: './admin-clients-management.component.html',
  styleUrls: ['./admin-clients-management.component.scss']
})
export class AdminClientsManagementComponent implements OnInit {
  // Utilisateurs fictifs
  users: any[] = [
    {
      lastname: 'Doe',
      firstname: 'John',
      email: 'john.doe@example.com',
      phone: '0123456789',
      role: 'user',
      isBlocked: false
    },
    {
      lastname: 'Smith',
      firstname: 'Jane',
      email: 'jane.smith@example.com',
      phone: '0987654321',
      role: 'entreprise',
      isBlocked: true
    },
    {
      lastname: 'Dupont',
      firstname: 'Marie',
      email: 'marie.dupont@example.com',
      phone: '0654321987',
      role: 'professionnel',
      isBlocked: false
    }
  ];

  displayedColumns: string[] = ['lastname', 'firstname', 'email', 'phone', 'role', 'actions'];
  dataSource = new MatTableDataSource<any>(this.users);
  searchTerm: string = '';
  roles: string[] = ['user', 'entreprise', 'professionnel', 'admin'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  applyGlobalSearch() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  updateRole(user: any) {
    // Logic to update user role
    console.log(`Role updated for ${user.firstname} ${user.lastname} to ${user.role}`);
  }

  resetPassword(user: any) {
    if (confirm('Réinitialiser le mot de passe de cet utilisateur ?')) {
      // Logic to reset password
      console.log(`Password reset for ${user.firstname} ${user.lastname}`);
    }
  }

  toggleBlockUser(user: any) {
    const action = user.isBlocked ? 'Débloquer' : 'Bloquer';
    if (confirm(`${action} cet utilisateur ?`)) {
      user.isBlocked = !user.isBlocked;
      // Logic to update user status
      console.log(`User ${user.isBlocked ? 'blocked' : 'unblocked'}: ${user.firstname} ${user.lastname}`);
    }
  }
}
