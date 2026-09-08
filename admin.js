import { supabase } from './supabase-client.js';

if (typeof lucide !== 'undefined') lucide.createIcons();

let currentDonations = [];
let siteContent = null;
const formatMoney = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

// --- AUTH ---
supabase.auth.onAuthStateChange((event, session) => {
    const loginSec = document.getElementById('login-section');
    const dashSec = document.getElementById('dashboard-section');

    if (session) {
        if(loginSec) loginSec.classList.add('hidden');
        if(dashSec) dashSec.classList.remove('hidden');
        loadData();
    } else {
        if(loginSec) loginSec.classList.remove('hidden');
        if(dashSec) dashSec.classList.add('hidden');
    }
});

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailEl = document.getElementById('email');
    const passEl = document.getElementById('password');
    if(!emailEl || !passEl) return;

    const { error } = await supabase.auth.signInWithPassword({
        email: emailEl.value,
        password: passEl.value
    });
    if (error) Toastify({ text: "Auth Failed", backgroundColor: "#ef4444" }).showToast();
});

document.getElementById('logout-btn')?.addEventListener('click', () => supabase.auth.signOut());

// --- TAB ROUTING (Safe Binding) ---
function switchTab(activeKey) {
    const tabs = {
        overview: { btn: document.getElementById('nav-overview'), content: document.getElementById('tab-overview') },
        verify: { btn: document.getElementById('nav-verify'), content: document.getElementById('tab-verify') },
        offline: { btn: document.getElementById('nav-offline'), content: document.getElementById('tab-offline') },
        cms: { btn: document.getElementById('nav-cms'), content: document.getElementById('tab-cms') },
        poster: { btn: document.getElementById('nav-poster'), content: document.getElementById('tab-poster') }
    };
    
    Object.keys(tabs).forEach(key => {
        const tab = tabs[key];
        if(tab.content) {
            tab.content.classList.toggle('hidden', key !== activeKey);
        }
        if(tab.btn) {
            tab.btn.className = key === activeKey 
                ? 'w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800 text-white font-medium'
                : 'w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 font-medium text-slate-300';
        }
    });
}

document.getElementById('nav-overview')?.addEventListener('click', () => switchTab('overview'));
document.getElementById('nav-verify')?.addEventListener('click', () => switchTab('verify'));
document.getElementById('nav-offline')?.addEventListener('click', () => switchTab('offline'));
document.getElementById('nav-cms')?.addEventListener('click', () => switchTab('cms'));
document.getElementById('nav-poster')?.addEventListener('click', () => switchTab('poster'));

// --- CORE DATA LOAD ---
async function loadData() {
    const [donationsRes, cmsRes] = await Promise.all([
        supabase.from('donations').select('*').order('created_at', { ascending: false }),
        supabase.from('site_content').select('*').single()
    ]);
    
    currentDonations = donationsRes.data || [];
    siteContent = cmsRes.data || {};
    
    updateAnalytics();
    renderTable();
    populateCMSForms();
}

function updateAnalytics() {
    const verified = currentDonations.filter(d => d.is_verified);
    const totalRaised = verified.reduce((sum, d) => sum + Number(d.amount), 0);
    const pendingCount = currentDonations.filter(d => !d.is_verified).length;
    const studentCount = Math.floor(totalRaised / (siteContent.unit_cost || 1));
    
    // Safely update DOM elements
    const raisedEl = document.getElementById('stat-total-raised');
    const studentsEl = document.getElementById('stat-students');
    const pendingEl = document.getElementById('stat-pending-count');

    if(raisedEl) raisedEl.textContent = formatMoney(totalRaised);
    if(studentsEl) studentsEl.textContent = studentCount;
    if(pendingEl) pendingEl.textContent = pendingCount;
}

// --- DONATIONS TABLE ---
function renderTable() {
    const tbody = document.getElementById('donations-tbody');
    if(!tbody) return;

    tbody.innerHTML = currentDonations.map(d => `
        <tr class="hover:bg-slate-50 group">
            <td class="p-4">
                <p class="font-bold text-slate-900">${d.donor_name}</p>
                <p class="text-xs text-slate-500">${d.district ? d.district+', ' : ''}${d.state}</p>
            </td>
            <td class="p-4">
                <p class="font-extrabold text-emerald-600">₹${d.amount}</p>
                <p class="text-[10px] font-bold px-1.5 py-0.5 rounded inline-block ${d.is_offline ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}">
                    ${d.is_offline ? 'OFFLINE COLLECTION' : 'ONLINE - UTR: ' + (d.transaction_ref || 'N/A')}
                </p>
            </td>
            <td class="p-4">
                ${d.is_verified ? '<span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Verified</span>' : '<span class="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Pending</span>'}
            </td>
            <td class="p-4 text-right">
                ${!d.is_verified ? `<button onclick="verifyDonation('${d.id}')" class="p-1.5 bg-emerald-500 text-white rounded mr-2"><i data-lucide="check" class="w-4 h-4"></i></button>` : ''}
                <button onclick="deleteDonation('${d.id}')" class="p-1.5 bg-red-50 text-red-600 rounded"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.verifyDonation = async (id) => {
    await supabase.from('donations').update({ is_verified: true, verified_at: new Date(), is_published_by_admin: true }).eq('id', id);
    loadData();
};
window.deleteDonation = async (id) => {
    if(confirm("Delete this?")) { await supabase.from('donations').delete().eq('id', id); loadData(); }
};

// --- OFFLINE ENTRY ---
document.getElementById('offline-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await supabase.from('donations').insert([{
        donor_name: document.getElementById('off_name')?.value || '',
        amount: document.getElementById('off_amount')?.value || 0,
        phone_number: document.getElementById('off_phone')?.value || null,
        state: document.getElementById('off_state')?.value || '',
        district: document.getElementById('off_district')?.value || '',
        donor_message: document.getElementById('off_message')?.value || '',
        donor_wants_public: document.getElementById('off_public')?.checked || false,
        is_verified: true,
        is_published_by_admin: true,
        is_offline: true
    }]);
    Toastify({ text: "Offline Collection Added", style: { background: "#10b981" } }).showToast();
    e.target.reset();
    loadData();
});

// --- CMS & POSTER CONFIG ---
function populateCMSForms() {
    if(!siteContent) return;
    
    // Page CMS Safely
    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
    
    setVal('cms_title', siteContent.campaign_title || '');
    setVal('cms_header', siteContent.header_text || '');
    setVal('cms_desc', siteContent.campaign_description || '');
    setVal('cms_target_units', siteContent.target_units || '');
    setVal('cms_unit_cost', siteContent.unit_cost || '');
    setVal('cms_upi', siteContent.upi_id || '');
    setVal('cms_thankyou', siteContent.thank_you_message || '');
    
    if(siteContent.end_date) {
        const date = new Date(siteContent.end_date);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        setVal('cms_end_date', date.toISOString().slice(0,16));
    }
    
    // Poster Config Safely
    const conf = siteContent.poster_config || { name:{}, amount:{}, state:{} };
    setVal('p_name_x', conf.name.x || 300); setVal('p_name_y', conf.name.y || 400); setVal('p_name_c', conf.name.color || '#ffffff');
    setVal('p_amt_x', conf.amount.x || 300); setVal('p_amt_y', conf.amount.y || 450); setVal('p_amt_c', conf.amount.color || '#10b981');
    setVal('p_state_x', conf.state.x || 300); setVal('p_state_y', conf.state.y || 500); setVal('p_state_c', conf.state.color || '#cbd5e1');
    
    window.previewPoster();
}

document.getElementById('cms-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-cms');
    if(btn) btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Saving...';
    if(typeof lucide !== 'undefined') lucide.createIcons();
    
    let logo_url = siteContent.logo_url;
    let banner_url = siteContent.banner_url;

    const logoFile = document.getElementById('cms_logo_file')?.files[0];
    const bannerFile = document.getElementById('cms_banner_file')?.files[0];
    
    if (logoFile) {
        const { data, error } = await supabase.storage.from('campaign-assets').upload(`logo_${Date.now()}.png`, logoFile);
        if(!error) logo_url = supabase.storage.from('campaign-assets').getPublicUrl(data.path).data.publicUrl;
    }

    if (bannerFile) {
        const { data, error } = await supabase.storage.from('campaign-assets').upload(`banner_${Date.now()}.png`, bannerFile);
        if(!error) banner_url = supabase.storage.from('campaign-assets').getPublicUrl(data.path).data.publicUrl;
    }

    const endDateVal = document.getElementById('cms_end_date')?.value;

    const { error } = await supabase.from('site_content').update({
        campaign_title: document.getElementById('cms_title')?.value || '',
        header_text: document.getElementById('cms_header')?.value || '',
        campaign_description: document.getElementById('cms_desc')?.value || '',
        target_units: document.getElementById('cms_target_units')?.value || 100,
        unit_cost: document.getElementById('cms_unit_cost')?.value || 100,
        upi_id: document.getElementById('cms_upi')?.value || '',
        end_date: endDateVal ? new Date(endDateVal).toISOString() : null,
        thank_you_message: document.getElementById('cms_thankyou')?.value || '',
        logo_url: logo_url,
        banner_url: banner_url
    }).eq('id', 1);

    if (error) {
        console.error(error);
        Toastify({ text: "Error Saving CMS Settings", backgroundColor: "#ef4444", gravity: "top" }).showToast();
    } else {
        Toastify({ text: "CMS Saved Successfully", style: { background: "#10b981" }, gravity: "top" }).showToast();
    }
    
    if(btn) btn.innerHTML = '<i data-lucide="save" class="w-5 h-5"></i> Save CMS Settings';
    if(typeof lucide !== 'undefined') lucide.createIcons();
    
    loadData(); // Refresh everything
});

// --- POSTER BUILDER ENGINE ---
window.previewPoster = () => {
    const canvas = document.getElementById('admin-preview-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0, canvas.width, canvas.height);
    
    const drawElements = () => {
        ctx.textAlign = "center";
        
        const nX = document.getElementById('p_name_x')?.value || 300;
        const nY = document.getElementById('p_name_y')?.value || 400;
        const nC = document.getElementById('p_name_c')?.value || '#ffffff';
        ctx.font = `bold 40px Inter`; ctx.fillStyle = nC;
        ctx.fillText("JANE DOE", nX, nY);
        
        const aX = document.getElementById('p_amt_x')?.value || 300;
        const aY = document.getElementById('p_amt_y')?.value || 450;
        const aC = document.getElementById('p_amt_c')?.value || '#10b981';
        ctx.font = `bold 30px Inter`; ctx.fillStyle = aC;
        ctx.fillText("₹1000", aX, aY);
        
        const sX = document.getElementById('p_state_x')?.value || 300;
        const sY = document.getElementById('p_state_y')?.value || 500;
        const sC = document.getElementById('p_state_c')?.value || '#cbd5e1';
        ctx.font = `bold 25px Inter`; ctx.fillStyle = sC;
        ctx.fillText("KERALA", sX, sY);
    };

    if(siteContent && siteContent.poster_bg_url) {
        const img = new Image(); img.crossOrigin = "Anonymous"; img.src = siteContent.poster_bg_url;
        img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); drawElements(); };
    } else {
        drawElements();
    }
};

document.getElementById('poster-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-poster');
    if(btn) btn.innerHTML = 'Saving...';
    
    let bg_url = siteContent.poster_bg_url;
    const fileInput = document.getElementById('poster_bg_file');
    
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const { data, error } = await supabase.storage.from('campaign-assets').upload(`poster_bg_${Date.now()}.png`, file);
        if(!error) bg_url = supabase.storage.from('campaign-assets').getPublicUrl(data.path).data.publicUrl;
    }

    const config = {
        name: { x: document.getElementById('p_name_x')?.value, y: document.getElementById('p_name_y')?.value, size: 40, color: document.getElementById('p_name_c')?.value },
        amount: { x: document.getElementById('p_amt_x')?.value, y: document.getElementById('p_amt_y')?.value, size: 30, color: document.getElementById('p_amt_c')?.value },
        state: { x: document.getElementById('p_state_x')?.value, y: document.getElementById('p_state_y')?.value, size: 25, color: document.getElementById('p_state_c')?.value }
    };

    await supabase.from('site_content').update({ poster_bg_url: bg_url, poster_config: config }).eq('id', 1);

    Toastify({ text: "Poster Template Saved", style: { background: "#10b981" } }).showToast();
    if(btn) btn.innerHTML = 'Save Configuration';
    loadData();
});