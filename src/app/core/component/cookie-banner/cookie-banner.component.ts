import { Component, OnInit } from '@angular/core';
import { ConsentService } from '../../services/consent.service';

type CookiePanel = 'choices' | 'settings' | 'policy';

@Component({
  selector: 'app-cookie-banner',
  templateUrl: './cookie-banner.component.html',
  styleUrls: ['./cookie-banner.component.scss'],
})
export class CookieBannerComponent implements OnInit {
  visible = false;
  panel: CookiePanel = 'choices';

  analytics = false;
  marketing = false;

  // 👉 Politique affichée dans la modale (HTML simple et lisible)
  // Remplace les placeholders [ ... ] plus bas.
  cookiePolicyHtml = COOKIE_POLICY_HTML;

  constructor(public consent: ConsentService) {}

  ngOnInit(): void {
    this.visible = !this.consent.hasChoice();

    const c = this.consent.consent;
    if (c) {
      this.analytics = !!c.categories.analytics;
      this.marketing = !!c.categories.marketing;
    }
  }

  acceptAll(): void {
    this.consent.acceptAll();
    this.close();
  }

  rejectAll(): void {
    this.consent.rejectAll();
    this.close();
  }

  openSettings(): void {
    this.panel = 'settings';
    this.visible = true;
    const c = this.consent.consent;
    this.analytics = c ? !!c.categories.analytics : false;
    this.marketing = c ? !!c.categories.marketing : false;
  }

  openPolicy(): void {
    this.panel = 'policy';
    this.visible = true;
  }

  backToChoices(): void {
    this.panel = 'choices';
  }

  saveSettings(): void {
    this.consent.saveCustom({ analytics: this.analytics, marketing: this.marketing });
    this.close();
  }

  close(): void {
    this.visible = false;
    this.panel = 'choices';
  }
}

// ✅ Politique cookie intégrée dans la modale (copier-coller)
const COOKIE_POLICY_HTML = `
<section class="policy">
  <h2>Cookie Policy — izyGlam</h2>
  <p class="meta">
    Last updated: January 15, 2026
  </p>

  <p>
    This Cookie Policy explains how <strong>izyGlam SAS</strong> ("izyGlam", "we", "our", or "us")
    uses cookies and similar tracking technologies when you access or use the izyGlam platform,
    including our website and associated digital services (the "Platform").
  </p>

  <p>
    We are committed to transparency, data protection, and compliance with applicable
    privacy regulations, including the General Data Protection Regulation (EU) 2016/679 (GDPR)
    and Article 82 of the French Data Protection Act (Loi Informatique et Libertés).
  </p>

  <hr/>

  <h3>1. What Are Cookies?</h3>
  <p>
    Cookies are small text files placed on your device when you visit a website or application.
    They enable a platform to recognize your device, remember preferences,
    ensure secure sessions, and collect statistical information.
  </p>

  <p>
    Cookies may be first-party (set by izyGlam) or third-party (set by trusted partners).
  </p>

  <hr/>

  <h3>2. Why We Use Cookies</h3>

  <h4>2.1 Strictly Necessary Cookies</h4>
  <p>
    These cookies are essential for the operation and security of the Platform.
    They enable core functionalities such as authentication, fraud prevention,
    secure payment flows, and account management.
  </p>
  <p>
    These cookies cannot be disabled as they are required for the service to function properly.
  </p>

  <h4>2.2 Analytics Cookies (Subject to Consent)</h4>
  <p>
    With your consent, we use analytics technologies to better understand how
    users interact with the Platform in order to improve usability,
    performance, and product development.
  </p>
  <p>
    Example provider:
    <ul>
      <li><strong>Google Analytics 4 (Google Ireland Ltd.)</strong></li>
    </ul>
  </p>

  <h4>2.3 Marketing & Advertising Cookies (Subject to Consent)</h4>
  <p>
    With your consent, we may use marketing cookies to measure campaign performance,
    prevent advertising fraud, and deliver relevant communications.
  </p>
  <p>
    Example providers:
    <ul>
      <li><strong>Meta Pixel (Meta Platforms Ireland Ltd.)</strong></li>
    </ul>
  </p>

  <hr/>

  <h3>3. Legal Basis</h3>
  <p>
    Strictly necessary cookies are processed based on our legitimate interest
    in providing a secure and functional service.
  </p>
  <p>
    Analytics and marketing cookies are processed solely on the basis of your prior consent,
    which you may withdraw at any time.
  </p>

  <hr/>

  <h3>4. Data Retention</h3>

  <ul>
    <li>Consent preferences: stored for a maximum of <strong>6 months</strong>.</li>
    <li>Analytics cookies: maximum lifespan of <strong>13 months</strong>.</li>
    <li>Analytics data retention: up to <strong>25 months</strong> in aggregated form.</li>
    <li>Session cookies: deleted upon logout or browser closure.</li>
  </ul>

  <hr/>

  <h3>5. International Transfers</h3>
  <p>
    Some analytics or advertising providers may process data outside the European Union.
    Where applicable, transfers are safeguarded through appropriate mechanisms,
    including Standard Contractual Clauses approved by the European Commission.
  </p>

  <hr/>

  <h3>6. Your Rights</h3>
  <p>
    In accordance with applicable data protection laws, you have the right to:
  </p>

  <ul>
    <li>Access your personal data</li>
    <li>Request rectification or deletion</li>
    <li>Restrict or object to processing</li>
    <li>Withdraw consent at any time</li>
    <li>Lodge a complaint with the French Data Protection Authority (CNIL)</li>
  </ul>

  <p>
    You may modify your cookie preferences at any time via the “Manage Cookies” interface.
  </p>

  <hr/>

  <h3>7. Controller Information</h3>

  <p>
    <strong>izyGlam SAS</strong><br/>
    Registered in France<br/>
    Registered Office: 10 Rue de l’Innovation, 75008 Paris, France<br/>
    Email: privacy@izyglam.com<br/>
  </p>

  <p>
    If you have questions regarding this policy, please contact us at:
    <strong>privacy@izyglam.com</strong>
  </p>

</section>
`;

