import { supabase } from './supabase-client.js';

lucide.createIcons();

let currentDonations = [];
let selectedIds = new Set();
const formatMoney = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

// --- AUTH & LOGIN STATE ---
const loginSec = document.getElementById('login-section');
const dashSec = document.getElementById('dashboard-section');

supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        loginSec.classList.add('hidden');
        dashSec.classList.remove('hidden');
        loadDonations();
        loadSettings();
    } else {
        loginSec.classList.remove('hidden');
        dashSec.classList.add('hidden');
    }
});

const loginBtn = document.getElementById('login-btn');
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    loginBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Authenticating...';
    lucide.createIcons();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        Toastify({ text: "Authentication Failed", backgroundColor: "#ef4444", gravity: "top" }).showToast();
        loginBtn.innerHTML = '<i data-lucide="log-in" class="w-5 h-5"></i> Secure Login';
        lucide.createIcons();
    }
});

document.getElementById('logout-btn').addEventListener('click', async () => await supabase.auth.signOut());
// --- TAB NAVIGATION ---
function switchTab(activeKey) {
    // Fetch elements dynamically to prevent null reference crashes
    const tabs = {
        overview: { btn: document.getElementById('nav-overview'), content: document.getElementById('tab-overview') },
        verify: { btn: document.getElementById('nav-verify'), content: document.getElementById('tab-verify') },
        settings: { btn: document.getElementById('nav-settings'), content: document.getElementById('tab-settings') }
    };

    Object.keys(tabs).forEach(key => {
        const tab = tabs[key];
        const isActive = key === activeKey;
        
        // Safely check if the content div exists before toggling classes
        if (tab.content) {
            tab.content.classList.toggle('hidden', !isActive);
        }
        
        // Safely style the button if it exists
        if (tab.btn) {
            if (isActive) {
                tab.btn.className = 'w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800 text-white font-medium transition-all shadow-sm';
                const icon = tab.btn.querySelector('i');
                if(icon) icon.classList.add('text-emerald-400');
            } else {
                tab.btn.className = 'w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 hover:text-white font-medium transition-all text-slate-400';
                const icon = tab.btn.querySelector('i');
                if(icon) icon.classList.remove('text-emerald-400');
            }
        }
    });
}

// Safely attach event listeners only if the buttons exist in the HTML
const navOverview = document.getElementById('nav-overview');
const navVerify = document.getElementById('nav-verify');
const navSettings = document.getElementById('nav-settings');

if (navOverview) navOverview.addEventListener('click', () => switchTab('overview'));
if (navVerify) navVerify.addEventListener('click', () => switchTab('verify'));
if (navSettings) navSettings.addEventListener('click', () => switchTab('settings'));
// --- DATA & ANALYTICS ---
document.getElementById('analytics-timeframe').addEventListener('change', updateAnalytics);

async function loadDonations() {
    const { data } = await supabase.from('donations').select('*').order('created_at', { ascending: false });
    currentDonations = data || [];
    selectedIds.clear();
    updateBulkUI();
    updateAnalytics();
    renderTable();
}

function updateAnalytics() {
    const timeframe = document.getElementById('analytics-timeframe').value;
    const now = new Date();
    
    const filteredStats = currentDonations.filter(d => {
        if(timeframe === 'all') return true;
        const dDate = new Date(d.created_at);
        if(timeframe === 'today') return dDate.toDateString() === now.toDateString();
        if(timeframe === 'week') return (now - dDate) < (7 * 24 * 60 * 60 * 1000);
        if(timeframe === 'month') return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear();
    });

    const verified = filteredStats.filter(d => d.is_verified);
    const pending = filteredStats.filter(d => !d.is_verified);
    
    document.getElementById('stat-total-raised').textContent = formatMoney(verified.reduce((sum, d) => sum + Number(d.amount), 0));
    document.getElementById('stat-pending-count').textContent = pending.length;
    document.getElementById('stat-donors').textContent = filteredStats.length;
}

// --- TABLE RENDERING & WHATSAPP ACTION ---
document.getElementById('search-input').addEventListener('input', renderTable);
document.getElementById('status-filter').addEventListener('change', renderTable);

function renderTable() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const status = document.getElementById('status-filter').value;

    const filtered = currentDonations.filter(d => {
        const matchesSearch = d.donor_name.toLowerCase().includes(searchTerm) || d.transaction_ref.toLowerCase().includes(searchTerm);
        const matchesStatus = status === 'all' || (status === 'verified' && d.is_verified) || (status === 'pending' && !d.is_verified);
        return matchesSearch && matchesStatus;
    });

    document.getElementById('donations-tbody').innerHTML = filtered.map(d => {
        const isChecked = selectedIds.has(d.id) ? 'checked' : '';
        // Format WhatsApp Number
        let waNum = d.phone_number.replace(/\D/g,'');
        if(waNum.length === 10) waNum = '91' + waNum;
        const waMsg = encodeURIComponent(`Hi ${d.donor_name}, thank you for supporting our campaign with ₹${d.amount}! `);

        return `
        <tr class="hover:bg-slate-50 transition-colors group">
            <td class="p-4"><input type="checkbox" class="row-checkbox w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" data-id="${d.id}" ${isChecked}></td>
            <td class="p-4">
                <p class="font-bold text-slate-900">${d.donor_name}</p>
                <div class="flex items-center gap-2">
                    <p class="text-xs text-slate-500">${d.phone_number}</p>
                    <a href="https://wa.me/${waNum}?text=${waMsg}" target="_blank" class="text-green-500 hover:text-green-600" title="Quick WhatsApp Chat"><i data-lucide="message-circle" class="w-3.5 h-3.5"></i></a>
                </div>
            </td>
            <td class="p-4">
                <p class="font-extrabold text-emerald-600">₹${d.amount}</p>
                <p class="text-[10px] text-slate-500 font-mono">UTR: ${d.transaction_ref}</p>
            </td>
            <td class="p-4 text-center">
                ${d.screenshot_url ? `<button onclick="viewReceipt('${d.screenshot_url}')" class="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs hover:bg-indigo-100 transition"><i data-lucide="image" class="w-3 h-3"></i></button>` : '-'}
                ${d.donor_message ? `<span class="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs ml-1" title="${d.donor_message}"><i data-lucide="message-square" class="w-3 h-3"></i></span>` : ''}
            </td>
            <td class="p-4">
                ${d.is_verified ? '<span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">Verified</span>' : '<span class="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">Pending</span>'}
            </td>
            <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${!d.is_verified ? `<button onclick="verifyDonation('${d.id}')" class="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-sm" title="Verify Payment"><i data-lucide="check" class="w-4 h-4"></i></button>` : ''}
                    
                    <button onclick="openEditModal('${d.id}', ${d.amount})" class="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition" title="Edit Amount"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    
                    <button onclick="deleteDonation('${d.id}')" class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition" title="Delete"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        </tr>
    `}).join('');
    
    lucide.createIcons();
    attachCheckboxListeners();
}

// --- BULK ACTIONS LOGIC ---
function attachCheckboxListeners() {
    document.querySelectorAll('.row-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            if(e.target.checked) selectedIds.add(e.target.dataset.id);
            else selectedIds.delete(e.target.dataset.id);
            updateBulkUI();
        });
    });
}

document.getElementById('selectAll').addEventListener('change', (e) => {
    document.querySelectorAll('.row-checkbox').forEach(cb => {
        cb.checked = e.target.checked;
        if(e.target.checked) selectedIds.add(cb.dataset.id);
    });
    if(!e.target.checked) selectedIds.clear();
    updateBulkUI();
});

function updateBulkUI() {
    const panel = document.getElementById('bulk-actions');
    if(selectedIds.size > 0) {
        panel.classList.remove('hidden');
        document.getElementById('bulk-count').textContent = `${selectedIds.size} selected`;
    } else {
        panel.classList.add('hidden');
        document.getElementById('selectAll').checked = false;
    }
}

document.getElementById('btn-bulk-verify').addEventListener('click', async () => {
    if(!confirm(`Are you sure you want to verify ${selectedIds.size} donations?`)) return;
    await Promise.all(Array.from(selectedIds).map(id => 
        supabase.from('donations').update({ is_verified: true, verified_at: new Date(), is_published_by_admin: true }).eq('id', id)
    ));
    Toastify({ text: "Bulk Verification Complete", backgroundColor: "#10b981", gravity: "top" }).showToast();
    loadDonations();
});

document.getElementById('btn-bulk-delete').addEventListener('click', async () => {
    if(!confirm(`Warning: Permanently DELETE ${selectedIds.size} donations?`)) return;
    await Promise.all(Array.from(selectedIds).map(id => supabase.from('donations').delete().eq('id', id)));
    Toastify({ text: "Bulk Deletion Complete", backgroundColor: "#ef4444", gravity: "top" }).showToast();
    loadDonations();
});

// --- SETTINGS CMS ---
async function loadSettings() {
    const { data } = await supabase.from('site_content').select('*').single();
    if (data) {
        document.getElementById('setting_title').value = data.campaign_title;
        document.getElementById('setting_upi').value = data.upi_id;
        
        if(data.end_date) {
            const date = new Date(data.end_date);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            document.getElementById('setting_end_date').value = date.toISOString().slice(0,16);
        }
    }
}

document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-settings-btn');
    btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Saving...';
    
    const end_date = document.getElementById('setting_end_date').value || null;

    await supabase.from('site_content').update({
        campaign_title: document.getElementById('setting_title').value,
        upi_id: document.getElementById('setting_upi').value,
        end_date: end_date ? new Date(end_date).toISOString() : null
    }).eq('id', 1);

    Toastify({ text: "Settings Saved Successfully", backgroundColor: "#10b981", gravity: "top" }).showToast();
    btn.innerHTML = '<i data-lucide="save"></i> Save Settings';
    lucide.createIcons();
});

// --- GLOBAL WINDOW FUNCTIONS FOR MODALS & ACTIONS ---
window.viewReceipt = (url) => {
    document.getElementById('modal-receipt-img').src = url;
    document.getElementById('modal-receipt').classList.remove('hidden');
};

window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

window.verifyDonation = async (id) => {
    await supabase.from('donations').update({ is_verified: true, is_published_by_admin: true }).eq('id', id);
    Toastify({ text: "Donation Verified", backgroundColor: "#10b981", gravity: "top" }).showToast();
    loadDonations();
};

window.deleteDonation = async (id) => {
    if(confirm("Are you sure you want to delete this donation?")) { 
        await supabase.from('donations').delete().eq('id', id); 
        Toastify({ text: "Donation Deleted", backgroundColor: "#ef4444", gravity: "top" }).showToast();
        loadDonations(); 
    }
};

window.openEditModal = (id, currentAmount) => {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-amount-input').value = currentAmount;
    document.getElementById('modal-edit').classList.remove('hidden');
};

window.submitEdit = async () => {
    const id = document.getElementById('edit-id').value;
    const newAmt = document.getElementById('edit-amount-input').value;
    
    if (newAmt && !isNaN(newAmt)) {
        await supabase.from('donations').update({ amount: Number(newAmt) }).eq('id', id);
        Toastify({ text: "Amount updated successfully", backgroundColor: "#3b82f6", gravity: "top" }).showToast();
        closeModal('modal-edit');
        loadDonations();
    }
};