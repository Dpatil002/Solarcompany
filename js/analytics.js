/**
 * Shree Ganesha Solar - Analytics, Attribution & Conversion Engine
 * Tracks user interactions and preserves UTM parameters privacy-consciously.
 * Zero PII (Personally Identifiable Information) is ever passed to analytics tags.
 */

class AnalyticsEngine {
  constructor() {
    this.sessionKey = 'sgs_utm_attribution';
    this.initAttribution();
    this.initDataLayer();
  }

  /**
   * Capture and preserve UTM parameters from URL search query
   */
  initAttribution() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
      const hasUtm = utmFields.some(field => urlParams.has(field));

      if (hasUtm) {
        const attribution = {
          utm_source: urlParams.get('utm_source') || '',
          utm_medium: urlParams.get('utm_medium') || '',
          utm_campaign: urlParams.get('utm_campaign') || '',
          utm_term: urlParams.get('utm_term') || '',
          utm_content: urlParams.get('utm_content') || '',
          referrer: document.referrer || '',
          timestamp: new Date().toISOString()
        };
        sessionStorage.setItem(this.sessionKey, JSON.stringify(attribution));
      }
    } catch (e) {
      // Graceful fallback if storage disabled
    }
  }

  /**
   * Retrieve stored attribution data for lead submission payload
   */
  getAttribution() {
    try {
      const raw = sessionStorage.getItem(this.sessionKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    return {
      utm_source: 'direct',
      utm_medium: 'website',
      utm_campaign: '',
      utm_term: '',
      utm_content: '',
      referrer: document.referrer || ''
    };
  }

  /**
   * Ensure window.dataLayer is initialized for GA4 / GTM
   */
  initDataLayer() {
    window.dataLayer = window.dataLayer || [];
  }

  /**
   * Push an event to dataLayer (Google Tag Manager / GA4 ready)
   * @param {string} eventName
   * @param {object} eventParams - Non-PII parameters only
   */
  trackEvent(eventName, eventParams = {}) {
    const payload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      ...eventParams
    };
    
    window.dataLayer.push(payload);

    // Optional debug logging in development mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log(`[SGS Analytics Event: ${eventName}]`, payload);
    }
  }

  /**
   * Track when a customer begins filling the lead form
   */
  trackFormStart(formId) {
    this.trackEvent('sgs_form_start', {
      form_id: formId
    });
  }

  /**
   * Track successful lead capture without transmitting PII
   */
  trackLeadSuccess(leadId, propertyType, monthlyBill) {
    this.trackEvent('sgs_quote_submission', {
      lead_id: leadId,
      property_type: propertyType,
      bill_bracket: monthlyBill >= 15000 ? 'high' : monthlyBill >= 5000 ? 'medium' : 'standard'
    });

    // Optional Google Ads conversion hook if gtag is configured
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        send_to: window.SGS_ADS_CONVERSION_ID || 'AW-CONVERSION_PLACEHOLDER/quote_lead',
        value: 1.0,
        currency: 'INR',
        transaction_id: leadId
      });
    }
  }

  /**
   * Track phone call intent
   */
  trackCallClick(phoneNumber) {
    this.trackEvent('sgs_call_click', {
      phone_action: phoneNumber
    });
  }

  /**
   * Track WhatsApp messaging intent
   */
  trackWhatsAppClick(sourceSection) {
    this.trackEvent('sgs_whatsapp_click', {
      source_section: sourceSection
    });
  }

  /**
   * Track interactive calculator adjustment
   */
  trackCalculator(kw, bill) {
    this.trackEvent('sgs_calculator_interact', {
      estimated_kw: kw,
      bill_value: bill
    });
  }
}

export const analytics = new AnalyticsEngine();
