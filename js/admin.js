/**
 * Shree Ganesha Solar - Admin Portal Controller
 * Manages lead retrieval, inline status updates, staff notes, and CSV export.
 */

class AdminController {
  constructor() {
    this.adminKey = sessionStorage.getItem('sgs_admin_key') || '';
    this.currentStatus = 'all';
    this.searchQuery = '';
    
    this.init();
  }

  init() {
    this.bindEvents();
    if (this.adminKey) {
      this.verifyAndLoad();
    } else {
      this.showLogin();
    }
  }

  bindEvents() {
    const loginForm = document.getElementById('adminLoginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const filterButtons = document.querySelectorAll('#statusFilterBar .admin-filter-btn');
    const searchInput = document.getElementById('leadSearchInput');
    const exportBtn = document.getElementById('exportCsvBtn');
    const liveLink = document.getElementById('viewLiveWebsiteLink');

    // Dynamically adjust 'View Live Website' link so clicking it from admin subdomain navigates to the apex domain
    if (liveLink) {
      const currentHost = window.location.hostname;
      const currentPort = window.location.port ? `:${window.location.port}` : '';
      const protocol = window.location.protocol;
      if (currentHost.includes('.')) {
        // Remove the leading subdomain component (e.g., 'admin.shreeganeshasolar.com' -> 'shreeganeshasolar.com' or 'admin.localhost' -> 'localhost')
        const apexHost = currentHost.replace(/^[^.]+\./, '');
        liveLink.href = `${protocol}//${apexHost}${currentPort}/`;
      } else {
        liveLink.href = '/';
      }
    }

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputKey = document.getElementById('adminKeyInput').value.trim();
        this.adminKey = inputKey;
        await this.verifyAndLoad();
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('sgs_admin_key');
        this.adminKey = '';
        this.showLogin();
      });
    }

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentStatus = btn.getAttribute('data-status') || 'all';
        this.loadLeads();
      });
    });

    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.searchQuery = e.target.value;
          this.loadLeads();
        }, 300);
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (!this.adminKey) return;
        window.location.href = `/api/admin/leads/export?key=${encodeURIComponent(this.adminKey)}`;
      });
    }
  }

  showLogin() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex';
  }

  hideLogin() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
  }

  async verifyAndLoad() {
    const errorEl = document.getElementById('loginErrorMsg');
    try {
      const res = await fetch(`/api/admin/stats?key=${encodeURIComponent(this.adminKey)}`);
      if (res.ok) {
        sessionStorage.setItem('sgs_admin_key', this.adminKey);
        this.hideLogin();
        if (errorEl) errorEl.style.display = 'none';
        this.loadStats();
        this.loadLeads();
      } else {
        if (errorEl) errorEl.style.display = 'block';
        sessionStorage.removeItem('sgs_admin_key');
      }
    } catch (e) {
      if (errorEl) errorEl.style.display = 'block';
    }
  }

  async loadStats() {
    try {
      const res = await fetch(`/api/admin/stats?key=${encodeURIComponent(this.adminKey)}`);
      const data = await res.json();
      if (data.success && data.stats) {
        document.getElementById('statTotal').textContent = data.stats.total || 0;
        document.getElementById('statNew').textContent = data.stats.new || 0;
        document.getElementById('statVisits').textContent = data.stats.site_visit_scheduled || 0;
        document.getElementById('statWon').textContent = data.stats.closed_won || 0;
      }
    } catch (e) {}
  }

  async loadLeads() {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;

    try {
      const url = `/api/admin/leads?key=${encodeURIComponent(this.adminKey)}&status=${this.currentStatus}&search=${encodeURIComponent(this.searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.success || !data.leads || data.leads.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 3rem; color: #64748B;">
              No inquiries found matching current filters.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = data.leads.map(lead => {
        const dateObj = new Date(lead.created_at);
        const formattedDate = dateObj.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        const formattedTime = dateObj.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const billDisplay = lead.monthly_bill 
          ? `₹${Number(lead.monthly_bill).toLocaleString('en-IN')}/mo` 
          : 'Not specified';

        return `
          <tr data-lead-id="${lead.id}">
            <td>
              <strong style="color: #0E223D; font-family: monospace;">${lead.id}</strong>
              <div style="font-size: 11px; color: #64748B;">${formattedDate} at ${formattedTime}</div>
            </td>
            <td>
              <div style="font-weight: 700; color: #0F172A;">${escapeHtml(lead.name)}</div>
              <div style="font-size: 12px; color: #0284C7;">+91 ${escapeHtml(lead.phone)}</div>
            </td>
            <td>
              <div style="text-transform: capitalize; font-weight: 600;">${escapeHtml(lead.property_type)}</div>
              <div style="font-size: 12px; color: #64748B;">${billDisplay}</div>
            </td>
            <td>
              <div style="font-weight: 600;">${escapeHtml(lead.area || 'Pune')}</div>
            </td>
            <td>
              <div style="font-size: 12px; color: #475569;">
                <strong>${escapeHtml(lead.utm_source || 'direct')}</strong> / ${escapeHtml(lead.utm_medium || 'website')}
              </div>
              ${lead.utm_campaign ? `<div style="font-size: 11px; color: #94A3B8;">Campaign: ${escapeHtml(lead.utm_campaign)}</div>` : ''}
            </td>
            <td>
              <select class="status-select" onchange="window.adminCtrl.handleStatusChange('${lead.id}', this.value)" style="padding: 0.35rem 0.6rem; border-radius: 6px; font-size: 12px; font-weight: 700; border: 1px solid #CBD5E1; background: #FFFFFF;">
                <option value="new" ${lead.status === 'new' ? 'selected' : ''}>🟡 New Inquiry</option>
                <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>🔵 Contacted</option>
                <option value="site_visit_scheduled" ${lead.status === 'site_visit_scheduled' ? 'selected' : ''}>🟣 Visit Scheduled</option>
                <option value="quote_sent" ${lead.status === 'quote_sent' ? 'selected' : ''}>📄 Quote Sent</option>
                <option value="closed_won" ${lead.status === 'closed_won' ? 'selected' : ''}>🟢 Closed Won</option>
                <option value="closed_lost" ${lead.status === 'closed_lost' ? 'selected' : ''}>🔴 Closed Lost</option>
              </select>
            </td>
            <td>
              <div style="display: flex; gap: 0.4rem;">
                <a href="tel:+91${encodeURIComponent(lead.phone)}" class="admin-action-btn btn-action-call" title="Call Customer">
                  📞 Call
                </a>
                <a href="https://wa.me/91${encodeURIComponent(lead.phone)}?text=${encodeURIComponent(`Hello ${lead.name}, greetings from Shree Ganesha Solar! We received your rooftop solar inquiry for your property in ${lead.area || 'Pune'}.`)}" target="_blank" rel="noopener noreferrer" class="admin-action-btn btn-action-wa" title="WhatsApp Message">
                  💬 Chat
                </a>
                <button onclick="window.adminCtrl.handleEditNotes('${lead.id}', '${encodeURIComponent(lead.notes || '')}')" class="admin-action-btn" style="background: #F8FAFC; border: 1px solid #CBD5E1; color: #475569;">
                  📝 Notes
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

    } catch (e) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: #DC2626;">
            Failed to load inquiries. Check connection.
          </td>
        </tr>
      `;
    }
  }

  async handleStatusChange(id, newStatus) {
    try {
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(id)}?key=${encodeURIComponent(this.adminKey)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        this.loadStats();
      }
    } catch (e) {
      alert('Failed to update lead status.');
    }
  }

  async handleEditNotes(id, encodedCurrentNotes) {
    const currentNotes = decodeURIComponent(encodedCurrentNotes);
    const newNotes = prompt('Internal Staff Notes for this Lead:', currentNotes);
    if (newNotes === null) return;

    try {
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(id)}?key=${encodeURIComponent(this.adminKey)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: newNotes })
      });
      if (res.ok) {
        this.loadLeads();
      }
    } catch (e) {
      alert('Failed to save staff notes.');
    }
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  window.adminCtrl = new AdminController();
});
