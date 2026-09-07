import { supabase } from './supabase-client.js';

// Init Icons
lucide.createIcons();

// Elements
const loginSec = document.getElementById('login-section');
const dashSec = document.getElementById('dashboard-section');
let currentDonations = [];

// Auth State Listener
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

// Login Flow
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Toastify({ text: error.message, backgroundColor: "#dc2626" }).showToast();
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
});

// Tab Navigation Logic
const btnVerify = document.getElementById('nav-verify');
const btnSettings = document.getElementById('nav-settings');
const tabVerify = document.getElementById('tab-verify');
const tabSettings = document.getElementById('tab-settings');

function switchTab(activeBtn, inactiveBtn, activeTab, inactiveTab) {
    activeBtn.className = 'w-full flex items-center gap-3 p-3 rounded-lg bg-emerald-600 text-white transition';
    inactiveBtn.className = 'w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 hover:text-white transition text-slate-300';
    activeTab.classList.remove('hidden');
    inactiveTab.classList.add('hidden');
}

btnVerify.addEventListener('click', () => switchTab(btnVerify, btnSettings, tabVerify, tabSettings));
btnSettings.addEventListener('click', () => switchTab(btnSettings, btnVerify, tabSettings, tabVerify));

// --- VERIFY PAYMENTS TAB ---
async function loadDonations() {
    const { data, error } = await supabase.from('donations').select('*').order('created_at', { ascending: false });
    if (error) return console.error(error);
    currentDonations = data;
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('donations-tbody');
    tbody.innerHTML = currentDonations.map(d => `
        <tr class="${d.is_verified ? 'bg-emerald-50/30' : 'bg-white'} hover:bg-slate-50 transition">
            <td class="p-4 text-xs text-slate-500">${new Date(d.created_at).toLocaleString()}</td>
            <td class="p-4">
                <p class="font-medium text-slate-900">${d.donor_name}</p>
                <p class="text-xs text-slate-500">${d.phone_number}</p>
            </td>
            <td class="p-4">
                <p class="font-medium text-emerald-600">₹${d.amount}</p>
                <p class="text-xs text-slate-500 font-mono">${d.transaction_ref}</p>
            </td>
            <td class="p-4">
                ${d.screenshot_url ? `<a href="${d.screenshot_url}" target="_blank" class="text-blue-600 hover:underline text-xs flex items-center gap-1"><i data-lucide="image" class="w-3 h-3"></i> View</a>` : '-'}
            </td>
            <td class="p-4">
                ${d.is_verified ? '<span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">Verified</span>' : '<span class="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">Pending</span>'}
            </td>
            <td class="p-4 flex gap-2">
                ${!d.is_verified ? `<button onclick="verifyDonation('${d.id}')" class="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200" title="Mark Verified"><i data-lucide="check" class="w-4 h-4"></i></button>` : ''}
                <button onclick="editAmount('${d.id}', ${d.amount})" class="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" title="Edit Amount"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                ${d.donor_wants_public ? `
                    <button onclick="togglePublish('${d.id}', ${d.is_published_by_admin})" class="p-1.5 ${d.is_published_by_admin ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'} rounded hover:bg-slate-200" title="Toggle Wall Visibility">
                        <i data-lucide="${d.is_published_by_admin ? 'eye' : 'eye-off'}" class="w-4 h-4"></i>
                    </button>
                ` : `<span class="p-1.5 text-slate-300" title="Donor requested privacy"><i data-lucide="lock" class="w-4 h-4"></i></span>`}
                <button onclick="deleteDonation('${d.id}')" class="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Delete"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

// Inline Table Actions attached to window to bypass ES Module scoping for onclick events
window.verifyDonation = async (id) => {
    await supabase.from('donations').update({ is_verified: true, verified_at: new Date() }).eq('id', id);
    Toastify({ text: "Payment Verified", backgroundColor: "#059669" }).showToast();
    loadDonations();
};

window.editAmount = async (id, currentAmount) => {
    const newAmt = prompt("Correct the amount (INR):", currentAmount);
    if (newAmt && !isNaN(newAmt)) {
        await supabase.from('donations').update({ amount: Number(newAmt) }).eq('id', id);
        loadDonations();
    }
};

window.togglePublish = async (id, currentState) => {
    await supabase.from('donations').update({ is_published_by_admin: !currentState }).eq('id', id);
    loadDonations();
};

window.deleteDonation = async (id) => {
    if(confirm("Delete this record permanently?")) {
        await supabase.from('donations').delete().eq('id', id);
        loadDonations();
    }
};

// CSV Export
document.getElementById('export-csv').addEventListener('click', () => {
    if(!currentDonations.length) return;
    const headers = Object.keys(currentDonations[0]).join(',');
    const rows = currentDonations.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
});

// --- SETTINGS (CMS) TAB ---
async function loadSettings() {
    const { data } = await supabase.from('site_content').select('*').single();
    if (data) {
        document.getElementById('setting_title').value = data.campaign_title;
        document.getElementById('setting_desc').value = data.campaign_description;
        document.getElementById('setting_type').value = data.campaign_type;
        document.getElementById('setting_upi').value = data.upi_id;
        document.getElementById('setting_target_amt').value = data.target_amount;
        document.getElementById('setting_unit_cost').value = data.unit_cost;
    }
}

document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-settings-btn');
    btn.textContent = 'Saving...';
    
    await supabase.from('site_content').update({
        campaign_title: document.getElementById('setting_title').value,
        campaign_description: document.getElementById('setting_desc').value,
        campaign_type: document.getElementById('setting_type').value,
        upi_id: document.getElementById('setting_upi').value,
        target_amount: document.getElementById('setting_target_amt').value,
        unit_cost: document.getElementById('setting_unit_cost').value
    }).eq('id', 1);

    Toastify({ text: "Settings Saved", backgroundColor: "#059669" }).showToast();
    btn.textContent = 'Save Changes';
});