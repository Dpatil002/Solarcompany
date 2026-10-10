/**
 * Shree Ganesha Solar - Core Application Controller
 * Handles Bilingual Localization (EN/MR), Real Lead Management API Integration,
 * Analytics & UTM Attribution Tracking, Interactive Calculator, Tabs, and FAQ.
 */

import { translations } from './translations.js';
import { SolarCalculator } from './calculator.js';
import { analytics } from './analytics.js';

class SolarApp {
  constructor() {
    this.calculator = new SolarCalculator();
    this.currentLang = localStorage.getItem('sgs_lang') || 'en';

    this.currentMonthlyBill = 5000;
    this.currentCategory = 'residential';
    this.currentTariff = 8.50;

    this.hasTrackedFormStart = false;

    this.solutionData = {
      homes: {
        img: 'images/residential-solar-pune.jpg',
        title: { en: 'For your home', mr: 'तुमच्या घरासाठी' },
        desc: {
          en: 'Cut household electricity bills, run ACs during peak summer afternoons worry-free, and claim up to ₹78,000 in direct central subsidy.',
          mr: 'घरगुती वीज बिल कमी करा, उन्हाळ्यात बिनधास्त एसी चालवा आणि थेट ₹७८,००० पर्यंत केंद्र सरकारची सबसिडी मिळवा.'
        },
        bullets: {
          en: [
            'Cut monthly electricity bills by up to 90%',
            'Up to ₹78,000 central subsidy under PM Surya Ghar',
            'Elevated structures that keep your terrace usable'
          ],
          mr: [
            'मासिक वीज बिलात ९०% पर्यंत कपात',
            'पंतप्रधान सूर्य घर योजनेअंतर्गत ₹७८,००० पर्यंत सबसिडी',
            'गच्चीचा वापर अबाधित ठेवणारे एलिव्हेटेड स्ट्रक्चर्स'
          ]
        }
      },
      societies: {
        img: 'images/society-solar-pune.jpg',
        title: { en: 'For housing societies', mr: 'गृहनिर्माण संस्थांसाठी' },
        desc: {
          en: 'Power common amenities including elevators, water lifting pumps, basement lighting, and clubhouses to slash monthly maintenance collections.',
          mr: 'लिफ्ट, पाणी उपसणारे पंप, बेसमेंट आणि क्लबहाऊससाठी सोलर वीज वापरून मासिक मेंटेनन्स खर्च लक्षणीय कमी करा.'
        },
        bullets: {
          en: [
            'Slash common area electricity bills by up to 85%',
            'Subsidies available up to 500 kW capacity',
            'Robust structural load analysis for high-rise buildings'
          ],
          mr: [
            'सोसायटीच्या वीज बिलात ८५% पर्यंत कपात',
            '५०० किलोवॅट क्षमतेपर्यंत सबसिडी सहाय्य',
            'इमारतींच्या सुरक्षिततेसाठी अचूक स्ट्रक्चरल डिझाईन'
          ]
        }
      },
      businesses: {
        img: 'images/commercial-solar-pune.jpg',
        title: { en: 'For commercial operations', mr: 'व्यावसायिक व औद्योगिक आस्थापनांसाठी' },
        desc: {
          en: 'High-capacity rooftop installations for factories, warehouses, schools, and hospitals with accelerated depreciation tax benefits.',
          mr: 'कारखाने, गोदामे, शाळा आणि रुग्णालयांसाठी उच्च क्षमतेचे रूफटॉप सोलर आणि ४०% कर सवलत (Accelerated Depreciation).'
        },
        bullets: {
          en: [
            'Massive daytime power cost reduction for high-tariff units',
            '40% accelerated depreciation tax savings in year one',
            'Custom non-penetrating clamping for metal sheds'
          ],
          mr: [
            'महागड्या कमर्शियल वीज दरांपासून मोठी बचत',
            'पहिल्याच वर्षी ४०% इन्कम टॅक्स डेप्रिसिएशन सवलत',
            'मेटल शेड छतांसाठी सुरक्षित क्लॅम्पिंग स्ट्रक्चर्स'
          ]
        }
      }
    };

    this.activeSolutionTab = 'homes';

    this.init();
  }

  init() {
    this.setupLanguage();
    this.setupHeaderScroll();
    this.setupLeadForms();
    this.setupCalculator();
    this.setupSolutionTabs();
    this.setupFaqAccordion();
    this.setupMobileMenu();
    this.setupScrollSpy();
    this.setupAnalyticsListeners();
  }

  /* ------------------------------------------------------------------------
     1. Bilingual Localization (English & Marathi)
     ------------------------------------------------------------------------ */
  setupLanguage() {
    const langToggleBtn = document.getElementById('langToggleBtn');

    const applyLanguage = (lang) => {
      this.currentLang = lang;
      document.body.setAttribute('lang', lang);
      document.documentElement.setAttribute('lang', lang);
      localStorage.setItem('sgs_lang', lang);

      const dict = translations[lang] || translations.en;

      // Update all elements carrying [data-i18n]
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
          if (dict[key].includes('<br>')) {
            el.innerHTML = dict[key];
          } else if (el.children.length === 0) {
            el.textContent = dict[key];
          } else {
            const firstText = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
            if (firstText) firstText.textContent = dict[key];
            else el.textContent = dict[key];
          }
        }
      });

      // Update input placeholders for both forms
      const nameInput = document.getElementById('leadName');
      const phoneInput = document.getElementById('leadPhone');
      const areaInput = document.getElementById('leadArea');
      const nameInput2 = document.getElementById('leadName2');
      const phoneInput2 = document.getElementById('leadPhone2');
      const areaInput2 = document.getElementById('leadArea2');

      if (nameInput) nameInput.placeholder = dict.cardPlaceName;
      if (phoneInput) phoneInput.placeholder = dict.cardPlacePhone;
      if (areaInput) areaInput.placeholder = dict.cardPlaceArea;

      if (nameInput2) nameInput2.placeholder = dict.cardPlaceName;
      if (phoneInput2) phoneInput2.placeholder = dict.cardPlacePhone;
      if (areaInput2) areaInput2.placeholder = dict.cardPlaceArea;

      this.renderSolutionTab();
      this.updateCalculatorUI();
    };

    applyLanguage(this.currentLang);

    if (langToggleBtn) {
      langToggleBtn.addEventListener('click', () => {
        const nextLang = this.currentLang === 'en' ? 'mr' : 'en';
        applyLanguage(nextLang);
        analytics.trackEvent('sgs_language_toggle', { new_language: nextLang });
      });
    }
  }

  /* ------------------------------------------------------------------------
     2. Header Scroll Condensation
     ------------------------------------------------------------------------ */
  setupHeaderScroll() {
    const header = document.getElementById('siteHeader');
    if (!header) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          header.classList.toggle('scrolled', window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ------------------------------------------------------------------------
     3. Real Full-Stack Lead Submission with Database Persistence
     ------------------------------------------------------------------------ */
  setupLeadForms() {
    const scrollBtn = document.getElementById('heroScrollToFormBtn');
    const nameInput = document.getElementById('leadName');

    if (scrollBtn && nameInput) {
      scrollBtn.addEventListener('click', () => {
        nameInput.focus();
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    // Hero Form
    const heroForm = document.getElementById('heroPropertyForm');
    if (heroForm) {
      heroForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit(heroForm, {
          name: document.getElementById('leadName')?.value,
          phone: document.getElementById('leadPhone')?.value,
          monthly_bill: document.getElementById('leadBill')?.value,
          property_type: document.getElementById('leadProperty')?.value,
          area: document.getElementById('leadArea')?.value,
          consent: document.getElementById('leadConsent')?.checked,
          honeypot: document.getElementById('heroHoneypot')?.value
        });
      });

      // Track first interaction
      heroForm.addEventListener('focusin', () => {
        if (!this.hasTrackedFormStart) {
          analytics.trackFormStart('hero');
          this.hasTrackedFormStart = true;
        }
      }, { once: true });
    }

    // Final Footer Form
    const finalForm = document.getElementById('finalPropertyForm');
    if (finalForm) {
      finalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit(finalForm, {
          name: document.getElementById('leadName2')?.value,
          phone: document.getElementById('leadPhone2')?.value,
          monthly_bill: document.getElementById('leadBill2')?.value,
          property_type: document.getElementById('leadProperty2')?.value,
          area: document.getElementById('leadArea2')?.value,
          consent: document.getElementById('leadConsent2')?.checked,
          honeypot: document.getElementById('finalHoneypot')?.value
        });
      });

      finalForm.addEventListener('focusin', () => {
        if (!this.hasTrackedFormStart) {
          analytics.trackFormStart('final');
          this.hasTrackedFormStart = true;
        }
      }, { once: true });
    }
  }

  async handleFormSubmit(formEl, fields) {
    const submitBtn = formEl.querySelector('button[type="submit"]');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    const isMr = this.currentLang === 'mr';

    // 1. Client-Side Validation
    const name = String(fields.name || '').trim();
    if (name.length < 2) {
      this.showFormError(formEl, isMr ? 'कृपया तुमचे पूर्ण नाव प्रविष्ट करा.' : 'Please enter your full name (at least 2 letters).');
      return;
    }

    let phone = String(fields.phone || '').trim().replace(/[\s\-\(\)\+]/g, '');
    if (phone.startsWith('91') && phone.length === 12) phone = phone.slice(2);
    if (!/^[6-9]\d{9}$/.test(phone)) {
      this.showFormError(formEl, isMr ? 'कृपया वैध १० अंकी मोबाईल नंबर प्रविष्ट करा.' : 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!fields.consent) {
      this.showFormError(formEl, isMr ? 'कृपया संमती द्या.' : 'Please agree to be contacted for your quote.');
      return;
    }

    // Remove any previous error message
    const prevErr = formEl.querySelector('.form-error-banner');
    if (prevErr) prevErr.remove();

    // 2. Loading State
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>⏳</span> <span>${isMr ? 'नोंदणी करत आहे...' : 'Registering Quote Request...'}</span>`;
    }

    // 3. Assemble Payload with Attribution
    const attribution = analytics.getAttribution();
    const payload = {
      name,
      phone,
      monthly_bill: parseFloat(fields.monthly_bill) || this.currentMonthlyBill,
      property_type: fields.property_type || 'home',
      area: fields.area || 'Pune',
      consent: true,
      website_url_check: fields.honeypot || '',
      ...attribution
    };

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Track success event in GA4 / Ads dataLayer
        analytics.trackLeadSuccess(data.leadId, payload.property_type, payload.monthly_bill);
        
        // Render rich verified success state
        this.renderSuccessState(formEl, name, data.leadId, payload.area);
      } else {
        throw new Error(data.error || 'Failed to submit inquiry.');
      }

    } catch (err) {
      console.error('[Lead Submit Error]:', err);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
      this.showFormError(formEl, isMr 
        ? 'क्षमस्व, विनंती पाठवताना तांत्रिक अडचण आली. कृपया थेट कॉल करा: +91 98810 54321' 
        : 'Could not connect to lead server. Please call us directly: +91 98810 54321'
      );
    }
  }

  showFormError(formEl, message) {
    let errBanner = formEl.querySelector('.form-error-banner');
    if (!errBanner) {
      errBanner = document.createElement('div');
      errBanner.className = 'form-error-banner';
      errBanner.style.cssText = 'background: #FEE2E2; color: #DC2626; padding: 0.65rem 0.85rem; border-radius: 6px; font-size: 13px; font-weight: 600; margin-bottom: 0.85rem; border: 1px solid #FCA5A5; text-align: left;';
      formEl.prepend(errBanner);
    }
    errBanner.textContent = `⚠️ ${message}`;
    errBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  renderSuccessState(container, customerName, leadId, area) {
    const isMr = this.currentLang === 'mr';
    const waText = encodeURIComponent(`Hello Shree Ganesha Solar, I submitted a rooftop solar inquiry (Ref: ${leadId}) for my property in ${area || 'Pune'}.`);

    container.innerHTML = `
      <div style="text-align: center; padding: 2.25rem 1rem; animation: fadeIn 0.3s ease;">
        <div style="width: 58px; height: 58px; border-radius: 50%; background: #DCFCE7; color: #16A34A; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto;">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style="font-size: 11px; font-weight: 800; color: #0284C7; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.35rem;">
          ${isMr ? 'तपासणीसाठी नोंदणी पूर्ण' : 'SITE VISIT REGISTERED'}
        </div>
        <h3 style="font-size: 1.35rem; font-weight: 800; color: #0F172A; margin-bottom: 0.5rem;">
          ${isMr ? 'धन्यवाद ' + customerName + '!' : 'Thank you, ' + customerName + '!'}
        </h3>
        <p style="font-size: 0.92rem; color: #475569; line-height: 1.6; margin-bottom: 1.25rem;">
          ${isMr 
            ? 'तुमची विनंती क्रमांक <strong style="color: #0E223D;">' + leadId + '</strong> यशस्वीरित्या जतन झाली आहे. आमचे पुणे सोलर इंजिनिअर १५ मिनिटांत संपर्क साधतील.'
            : 'Your inquiry <strong style="color: #0E223D;">' + leadId + '</strong> is saved. Our Pune technical advisor will review your electrical profile and call you within 15 minutes.'}
        </p>

        <a href="https://wa.me/919881054321?text=${waText}" class="btn-card-submit" style="width: 100%; text-decoration: none; justify-content: center; background: #25D366; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35);" target="_blank" rel="noopener noreferrer">
          💬 ${isMr ? 'व्हॉट्सॲपवर संदर्भ पाठवा' : 'Connect on WhatsApp with Ref ID'}
        </a>

        <div style="font-size: 11px; color: #94A3B8; margin-top: 0.85rem;">
          ${isMr ? 'तातडीच्या माहितीसाठी: ' : 'Direct helpline: '} <a href="tel:+919881054321" style="color: #0284C7; font-weight: 700;">+91 98810 54321</a>
        </div>
      </div>
    `;
  }

  /* ------------------------------------------------------------------------
     4. Interactive Savings Calculator
     ------------------------------------------------------------------------ */
  setupCalculator() {
    const billSlider = document.getElementById('monthlyBillSlider');
    const estimateCta = document.getElementById('calcEstimateCtaBtn');

    if (billSlider) {
      let calcTimer;
      billSlider.addEventListener('input', (e) => {
        this.currentMonthlyBill = parseFloat(e.target.value);
        this.updateCalculatorUI();

        clearTimeout(calcTimer);
        calcTimer = setTimeout(() => {
          const res = this.calculator.calculate(this.currentMonthlyBill, this.currentCategory, this.currentTariff);
          analytics.trackCalculator(res.recommendedKw, this.currentMonthlyBill);
        }, 500);
      });
    }

    if (estimateCta) {
      estimateCta.addEventListener('click', () => {
        const leadCard = document.getElementById('propertyFormCard');
        if (leadCard) {
          leadCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const nameField = document.getElementById('leadName');
          if (nameField) nameField.focus();
        }
        analytics.trackEvent('sgs_calculator_cta_click', { bill: this.currentMonthlyBill });
      });
    }

    this.updateCalculatorUI();
  }

  updateCalculatorUI() {
    const res = this.calculator.calculate(this.currentMonthlyBill, this.currentCategory, this.currentTariff);

    const billDisplay = document.getElementById('billDisplayVal');
    const kwEl = document.getElementById('calcOutputKw');
    const genEl = document.getElementById('calcOutputGen');
    const annualSavEl = document.getElementById('calcOutputAnnualSavings');
    const subsidyEl = document.getElementById('calcOutputSubsidy');
    const paybackEl = document.getElementById('calcOutputPayback');

    const yrSuffix = this.currentLang === 'mr' ? ' वर्षे' : ' Years';
    const unitsSuffix = this.currentLang === 'mr' ? ' युनिट्स' : ' units';

    if (billDisplay) billDisplay.textContent = `₹ ${this.formatCurrency(this.currentMonthlyBill)}`;
    if (kwEl) kwEl.textContent = `${res.recommendedKw.toFixed(1)} kW`;
    if (genEl) genEl.textContent = `${Math.round(res.monthlyUnitsGenerated)} ${unitsSuffix}`;
    if (annualSavEl) annualSavEl.textContent = `₹ ${this.formatCurrency(res.annualSavings)}`;
    if (subsidyEl) subsidyEl.textContent = `₹ ${this.formatCurrency(res.subsidy)}`;
    if (paybackEl) paybackEl.textContent = `${res.paybackYears} ${yrSuffix}`;
  }

  formatCurrency(num) {
    return new Intl.NumberFormat('en-IN').format(Math.round(num));
  }

  /* ------------------------------------------------------------------------
     5. Solar Solutions Tab Switching
     ------------------------------------------------------------------------ */
  setupSolutionTabs() {
    const tabs = document.querySelectorAll('.tab-pill-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        this.activeSolutionTab = tab.getAttribute('data-tab') || 'homes';
        this.renderSolutionTab();
        analytics.trackEvent('sgs_solution_tab_click', { solution_type: this.activeSolutionTab });
      });
    });
  }

  renderSolutionTab() {
    const data = this.solutionData[this.activeSolutionTab];
    if (!data) return;

    const img = document.getElementById('solutionTabImg');
    const title = document.getElementById('solutionTabTitle');
    const desc = document.getElementById('solutionTabDesc');
    const list = document.getElementById('solutionTabList');

    const lang = this.currentLang === 'mr' ? 'mr' : 'en';

    if (img) img.src = data.img;
    if (title) title.textContent = data.title[lang];
    if (desc) desc.textContent = data.desc[lang];

    if (list) {
      list.innerHTML = data.bullets[lang].map(bullet => `
        <li>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>${bullet}</span>
        </li>
      `).join('');
    }
  }

  /* ------------------------------------------------------------------------
     6. FAQ Accordion Interaction
     ------------------------------------------------------------------------ */
  setupFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach((item, index) => {
      const btn = item.querySelector('.faq-question-btn');
      const panel = item.querySelector('.faq-answer-panel');

      if (!btn || !panel) return;

      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');

        faqItems.forEach(other => {
          if (other !== item) {
            other.classList.remove('active');
            other.querySelector('.faq-question-btn')?.setAttribute('aria-expanded', 'false');
            const otherPanel = other.querySelector('.faq-answer-panel');
            if (otherPanel) otherPanel.style.maxHeight = '0px';
          }
        });

        if (!isOpen) {
          item.classList.add('active');
          btn.setAttribute('aria-expanded', 'true');
          panel.style.maxHeight = `${panel.scrollHeight + 30}px`;
          analytics.trackEvent('sgs_faq_expand', { question_index: index + 1 });
        } else {
          item.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
          panel.style.maxHeight = '0px';
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     7. Mobile Navigation
     ------------------------------------------------------------------------ */
  setupMobileMenu() {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const nav = document.querySelector('.header-nav');
    if (!mobileBtn || !nav) return;

    mobileBtn.addEventListener('click', () => {
      const isVisible = nav.style.display === 'flex';
      nav.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        nav.style.position = 'absolute';
        nav.style.top = '72px';
        nav.style.left = '0';
        nav.style.right = '0';
        nav.style.backgroundColor = '#FFFFFF';
        nav.style.flexDirection = 'column';
        nav.style.padding = '1.5rem';
        nav.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        nav.style.zIndex = '99';
      }
      analytics.trackEvent('sgs_mobile_menu_toggle', { opened: !isVisible });
    });
  }

  /* ------------------------------------------------------------------------
     8. Scroll Spy Navigation Highlight
     ------------------------------------------------------------------------ */
  setupScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.header-nav .nav-link');

    if (sections.length === 0 || navLinks.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const currentId = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === `#${currentId}`);
          });
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });

    sections.forEach(section => observer.observe(section));
  }

  /* ------------------------------------------------------------------------
     9. Global Click Analytics Listeners
     ------------------------------------------------------------------------ */
  setupAnalyticsListeners() {
    // Phone click listeners
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
      link.addEventListener('click', () => {
        analytics.trackCallClick('+919881054321');
      });
    });

    // WhatsApp click listeners
    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
      link.addEventListener('click', () => {
        analytics.trackWhatsAppClick(link.className.includes('floating') ? 'floating_badge' : 'page_link');
      });
    });
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new SolarApp();
});
