import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UserService } from '../../services/user.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-admin-clients-management',
  templateUrl: './admin-clients-management.component.html',
  styleUrls: ['./admin-clients-management.component.scss']
})
export class AdminClientsManagementComponent implements OnInit {
  // Utilisateurs fictifs
  users: any[] = [
    /*{
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
    }*/
  ];
  selectedUser: any = {};
  modalOpen = false;
  imageUsed: string | null = null;
  imagePreview: string | null = null;
  imgStorageUrl =  environment.APIimgStorageUrl.replace(/\/$/, '');
  displayedColumns: string[] = ['lastname', 'firstname', 'email', 'phone', 'role', 'actions'];
  searchTerm: string = '';
  roles: string[] = ['user', 'entreprise', 'professionnel', 'admin'];

  dataSource:any;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    localStorage.setItem("menu-param", 'admin');
    this.selectedUser.address = [];
    this.selectedUser.address[0] = {};
    this.userService.getAll().subscribe({
      next: (data: any[]) => {
        console.log(data);
        this.users = data;
        this.dataSource = new MatTableDataSource<any>(this.users);
        this.dataSource.paginator = this.paginator;
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  applyGlobalSearch() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  updateRole(user: any) {
    // Logic to update user role
    console.log(`Role updated for ${user.firstname} ${user.lastname} to ${user.role}`);
  }

  editUser(user: any) {
    this.modalOpen = true;
    this.selectedUser = user;
  }

  toggleBlockUser(user: any) {
    const action = user.isBlocked ? 'Débloquer' : 'Bloquer';
    if (confirm(`${action} cet utilisateur ?`)) {
      user.isBlocked = !user.isBlocked;
      // Logic to update user status
      console.log(`User ${user.isBlocked ? 'blocked' : 'unblocked'}: ${user.firstname} ${user.lastname}`);
    }
  }

  closeModal() {
    this.modalOpen = false;
  }
  
  saveService() {
    this.userService.update(this.selectedUser).subscribe({
      next: (data: any) => {
        console.log(data);
        this.modalOpen = false;
        // this.selectedUser = {};
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }
  onFileSelected(event: any): void {}
}
