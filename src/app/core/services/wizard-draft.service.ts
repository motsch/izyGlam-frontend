// wizard-draft.service.ts
import { Injectable } from '@angular/core';

const KEY = 'create_shop_wizard_draft_v1';

export interface CreateShopDraft {
  updatedAt: number;
  wizardOpen: boolean;
  wizardStep: number;

  auth: {
    email: string;
    authEmailExists: boolean | null;
    pendingEmailVerification: boolean;
    lastActivationCheckAt: string | null;
  };

  shop: any;
  address: {
    selectedCountry: string;
    postalCode: string;
    selectedCity: any;
    selectedArrondissement: string;
    deliveryPostalCodesList: string[];
    latitude: number;
    longitude: number;
  };

  created: {
    createdShopId: string | null;
    createdShopData: any | null;
  };
}

@Injectable({ providedIn: 'root' })
export class WizardDraftService {
  save(draft: CreateShopDraft) {
    localStorage.setItem(KEY, JSON.stringify(draft));
  }

  load(): CreateShopDraft | null {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  clear() {
    localStorage.removeItem(KEY);
  }
}
