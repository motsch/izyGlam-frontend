import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UserService } from '../../services/user.service';
import { environment } from 'src/environments/environment';

// ✅ Ajouts IzyGlam : toasts + i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-clients-management',
  templateUrl: './admin-clients-management.component.html',
  styleUrls: ['./admin-clients-management.component.scss']
})
export class AdminClientsManagementComponent implements OnInit, AfterViewInit {
  // -----------------------------
  // 👥 Utilisateurs
  // -----------------------------
  users: any[] = [];
  selectedUser: any = {};
  modalOpen = false;

  // 🖼️ (placeholders si tu ajoutes l’upload plus tard)
  imageUsed: string | null = null;
  imagePreview: string | null = null;

  // CDN images si besoin dans le template
  imgStorageUrl = environment.APIimgStorageUrl.replace(/\/$/, '');

  // Tableau Angular Material
  displayedColumns: string[] = ['lastname', 'firstname', 'email', 'phone', 'role', 'actions'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Recherche globale
  searchTerm: string = '';
  roles: string[] = ['user', 'entreprise', 'professionnel', 'admin'];

  constructor(
    private userService: UserService,

    // ✅ IzyGlam
    private toastr: ToastrService,
    private translate: TranslateService
  ) { }

  // ------------------------------------------------------
  // ⏱️ Chargement initial
  // ------------------------------------------------------
  ngOnInit(): void {
    localStorage.setItem('menu-param', 'admin');

    // Prépare le filtre global (sur plusieurs colonnes)
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const normalized = (v: any) =>
        (v ?? '')
          .toString()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();

      const target = normalized(filter);
      return [
        data.lastname,
        data.firstname,
        data.email,
        data.phone,
        data.role
      ].some(field => normalized(field).includes(target));
    };

    // Sélection user par défaut : adresse vide
    this.selectedUser.address = [];
    this.selectedUser.address[0] = {};

    // Charge la liste des utilisateurs
    this.userService.getAll().subscribe({
      next: (data: any[]) => {
        console.log('Users:', data);
        this.users = data;
        this.dataSource.data = this.users;

        // Si le paginator est déjà dispo (rare en OnInit), on l’associe
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des utilisateurs :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // ------------------------------------------------------
  // 🔗 Branchement du paginator après rendu de la vue
  // ------------------------------------------------------
  ngAfterViewInit(): void {
    // Associe paginator au dataSource une fois la vue prête
    this.dataSource.paginator = this.paginator;
  }

  // ------------------------------------------------------
  // 🔎 Recherche globale
  // ------------------------------------------------------
  applyGlobalSearch() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  // ------------------------------------------------------
  // 🏷️ Mise à jour du rôle (exemple minimal)
  // ------------------------------------------------------
  updateRole(user: any) {
    // Tu peux exposer une route dédiée côté backend (ex: PATCH /users/:id/role)
    // Ici, on garde update() générique pour ne rien “casser”.
    this.userService.update(user).subscribe({
      next: (updated: any) => {
        console.log('Rôle mis à jour :', updated);
        this.toastr.success(this.translate.instant('SUCCESS.USERUPDATED') || 'Utilisateur mis à jour.');
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du rôle :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // ------------------------------------------------------
  // ✏️ Édition (ouvre la modale)
  // ------------------------------------------------------
  editUser(user: any) {
    this.modalOpen = true;
    // ⚠️ On clone pour éviter les mutations directes dans le tableau
    this.selectedUser = JSON.parse(JSON.stringify(user));
  }

  // ------------------------------------------------------
  // 🚫 Bloquer / Débloquer un utilisateur
  // ------------------------------------------------------
  toggleBlockUser(user: any) {
    const action = user.isBlocked ? 'Débloquer' : 'Bloquer';
    if (confirm(`${action} cet utilisateur ?`)) {
      const updated = { ...user, isBlocked: !user.isBlocked };

      this.userService.update(updated).subscribe({
        next: (data: any) => {
          console.log(`Utilisateur ${updated.isBlocked ? 'bloqué' : 'débloqué'} :`, data);

          // MAJ locale de la ligne pour reflecter l’état
          const idx = this.users.findIndex(u => u._id === updated._id);
          if (idx > -1) {
            this.users[idx] = data;
            this.dataSource.data = [...this.users];
          }

          this.toastr.success(
            this.translate.instant('SUCCESS.USERUPDATED') || 'Utilisateur mis à jour.'
          );
        },
        error: (err) => {
          console.error('Erreur lors du blocage/déblocage utilisateur :', err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
      });
    }
  }

  // ------------------------------------------------------
  // ❌ Fermer la modale d’édition
  // ------------------------------------------------------
  closeModal() {
    this.modalOpen = false;
  }
  
  // ------------------------------------------------------
  // 💾 Sauvegarder les changements du formulaire modal
  // ------------------------------------------------------
  saveService() {
    this.userService.update(this.selectedUser).subscribe({
      next: (data: any) => {
        console.log('Utilisateur mis à jour :', data);
        this.modalOpen = false;

        // MAJ locale du tableau
        const idx = this.users.findIndex(u => u._id === data._id);
        if (idx > -1) {
          this.users[idx] = data;
          this.dataSource.data = [...this.users];
        }

        this.toastr.success(
          this.translate.instant('SUCCESS.USERUPDATED') || 'Utilisateur mis à jour.'
        );
      },
      error: (error: any) => {
        console.error('Erreur lors de la sauvegarde utilisateur :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }

  // ------------------------------------------------------
  // 📁 Placeholder pour l’upload d’image (si tu ajoutes plus tard)
  // ------------------------------------------------------
  onFileSelected(event: any): void {
    // À implémenter si besoin (preview + envoi)
  }

  // ------------------------------------------------------
  // ✨ Toast d’erreur stylisé IzyGlam (centralisé)
  // ------------------------------------------------------
  private showCustomToast(message: string) {
    // Standard : erreurs → toastr.error
    this.toastr.error(message);
  }
}
