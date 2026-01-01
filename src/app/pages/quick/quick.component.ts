import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

type QuickStep = 'category' | 'service' | 'when' | 'slots' | 'summary';

type QuickWhen = 'today' | 'tonight' | 'tomorrow' | 'week';

interface QuickCategory {
  id: string;
  label: string;
  icon: string;
  hint: string;
}

interface QuickService {
  id: string;
  categoryId: string;
  label: string;
  durationMin: number;
  priceFrom: number;
}

interface QuickSlot {
  iso: string;          // ISO date-time
  label: string;        // "18:30"
  meta: string;         // "Aujourd’hui"
}

@Component({
  selector: 'app-quick',
  templateUrl: './quick.component.html',
  styleUrls: ['./quick.component.scss']
})
export class QuickComponent implements OnInit {
  step: QuickStep = 'category';

  // User selections
  selectedCategory: QuickCategory | null = null;
  selectedService: QuickService | null = null;
  selectedWhen: QuickWhen = 'today';
  selectedSlot: QuickSlot | null = null;

  // Address (mock; replace with your real address service)
  addressLabel = '75001 — Paris';
  addressDetail = 'Modifier';

  // Data (mock; replace with API)
  categories: QuickCategory[] = [
    { id: 'hair', label: 'Coiffure', icon: '✂️', hint: 'Coupe, brushing…' },
    { id: 'nails', label: 'Manucure', icon: '💅', hint: 'Pose, soins…' },
    { id: 'massage', label: 'Massage', icon: '💆‍♀️', hint: 'Relax, deep…' },
    { id: 'makeup', label: 'Maquillage', icon: '💄', hint: 'Jour, soirée…' },
    { id: 'wax', label: 'Épilation', icon: '🧴', hint: 'Cire, soin…' },
  ];

  services: QuickService[] = [
    { id: 'hair_cut_blow', categoryId: 'hair', label: 'Coupe + brushing', durationMin: 45, priceFrom: 65 },
    { id: 'hair_blow', categoryId: 'hair', label: 'Brushing', durationMin: 30, priceFrom: 45 },
    { id: 'hair_cut', categoryId: 'hair', label: 'Coupe', durationMin: 30, priceFrom: 40 },

    { id: 'nails_classic', categoryId: 'nails', label: 'Manucure classique', durationMin: 45, priceFrom: 55 },
    { id: 'nails_semi', categoryId: 'nails', label: 'Vernis semi-permanent', durationMin: 60, priceFrom: 65 },

    { id: 'massage_relax', categoryId: 'massage', label: 'Massage relaxant', durationMin: 60, priceFrom: 85 },
    { id: 'massage_deep', categoryId: 'massage', label: 'Massage deep tissue', durationMin: 60, priceFrom: 95 },

    { id: 'makeup_day', categoryId: 'makeup', label: 'Maquillage jour', durationMin: 45, priceFrom: 70 },
    { id: 'makeup_evening', categoryId: 'makeup', label: 'Maquillage soirée', durationMin: 60, priceFrom: 90 },

    { id: 'wax_legs', categoryId: 'wax', label: 'Épilation jambes', durationMin: 45, priceFrom: 55 },
    { id: 'wax_full', categoryId: 'wax', label: 'Épilation complète', durationMin: 75, priceFrom: 85 },
  ];

  // Slots (mock; replace with API based on selection)
  slots: QuickSlot[] = [];

  // UI state
  search = '';
  loadingSlots = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Start on categories
    this.step = 'category';
  }

  // Navigation
  back(): void {
    const order: QuickStep[] = ['category', 'service', 'when', 'slots', 'summary'];
    const idx = order.indexOf(this.step);
    if (idx <= 0) {
      window.history.back();
      return;
    }
    this.step = order[idx - 1];

    // If going back from summary, keep selections. If going back from slots, keep selectedWhen but clear slot.
    if (this.step !== 'summary') {
      if (this.step === 'slots') {
        // coming from summary
      } else if (this.step === 'when') {
        this.selectedSlot = null;
      } else if (this.step === 'service') {
        this.selectedWhen = 'today';
        this.selectedSlot = null;
      }
    }
  }

  // Step handlers
  chooseCategory(cat: QuickCategory): void {
    this.selectedCategory = cat;
    this.selectedService = null;
    this.selectedSlot = null;
    this.search = '';
    this.step = 'service';
  }

  chooseService(svc: QuickService): void {
    this.selectedService = svc;
    this.selectedSlot = null;
    this.selectedWhen = 'today';
    this.step = 'when';
  }

  setWhen(when: QuickWhen): void {
    this.selectedWhen = when;
    this.selectedSlot = null;
  }

  async goSlots(): Promise<void> {
    if (!this.selectedService) return;

    this.step = 'slots';
    await this.loadSlots();
  }

  chooseSlot(slot: QuickSlot): void {
    this.selectedSlot = slot;
    this.step = 'summary';
  }

  // Final CTA (payment not included)
  goToPayment(): void {
    // Here you would navigate to your payment page with the selected data.
    // Not included by request.
    this.router.navigate(['/payment'], {
      queryParams: {
        serviceId: this.selectedService?.id,
        slot: this.selectedSlot?.iso
      }
    });
  }

  // Filters
  get filteredServices(): QuickService[] {
    if (!this.selectedCategory) return [];
    const list = this.services.filter(s => s.categoryId === this.selectedCategory!.id);

    const q = this.search.trim().toLowerCase();
    if (!q) return list;

    return list.filter(s => s.label.toLowerCase().includes(q));
  }

  // Mock slot generation (replace with API)
  async loadSlots(): Promise<void> {
    this.loadingSlots = true;
    this.slots = [];

    // simulate network
    await new Promise(res => setTimeout(res, 450));

    const labelMap: Record<QuickWhen, string> = {
      today: 'Aujourd’hui',
      tonight: 'Ce soir',
      tomorrow: 'Demain',
      week: 'Cette semaine'
    };

    const times =
      this.selectedWhen === 'tonight'
        ? ['18:00', '18:30', '19:00', '19:30', '20:00']
        : this.selectedWhen === 'today'
          ? ['12:30', '13:00', '13:30', '14:00', '18:00', '18:30']
          : this.selectedWhen === 'tomorrow'
            ? ['10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '17:30']
            : ['09:30', '10:30', '11:30', '14:00', '16:00', '18:00'];

    const baseDate = new Date();
    if (this.selectedWhen === 'tomorrow') baseDate.setDate(baseDate.getDate() + 1);
    if (this.selectedWhen === 'week') baseDate.setDate(baseDate.getDate() + 2);

    const isoDate = baseDate.toISOString().slice(0, 10);

    this.slots = times.map((t, i) => ({
      label: t,
      meta: labelMap[this.selectedWhen],
      iso: `${isoDate}T${t}:00.000Z`
    }));

    this.loadingSlots = false;
  }

  // UI helpers
  stepTitle(): string {
    switch (this.step) {
      case 'category': return 'Réservation rapide';
      case 'service': return 'Choisissez une prestation';
      case 'when': return 'Quand souhaitez-vous venir ?';
      case 'slots': return 'Choisissez un créneau';
      case 'summary': return 'Récapitulatif';
      default: return 'Réservation rapide';
    }
  }

  stepSubtitle(): string {
    switch (this.step) {
      case 'category': return 'Sélectionnez une catégorie. On s’occupe du reste.';
      case 'service': return 'Prix clair, durée indiquée, créneaux ensuite.';
      case 'when': return 'Choisissez un moment. Nous affichons les créneaux disponibles.';
      case 'slots': return 'Créneaux disponibles autour de vous.';
      case 'summary': return 'Vérifiez les informations avant paiement.';
      default: return '';
    }
  }

  whenLabel(w: QuickWhen): string {
    if (w === 'today') return 'Aujourd’hui';
    if (w === 'tonight') return 'Ce soir';
    if (w === 'tomorrow') return 'Demain';
    return 'Cette semaine';
  }

  formatPrice(n: number): string {
    return `${n.toFixed(0)}€`;
  }

  formatDuration(min: number): string {
    return `${min} min`;
  }
}
