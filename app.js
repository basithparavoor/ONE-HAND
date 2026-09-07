import { supabase } from './supabase-client.js';

lucide.createIcons();

const form = document.getElementById('donation-form');
const submitBtn = document.getElementById('submit-btn');

const formatMoney = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

// Number Counter Animation for the "Total Raised"
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // easeOutQuart
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        obj.innerHTML = formatMoney(Math.floor(easeProgress * (end - start) + start));
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

async function loadCampaignStats() {
    const { data, error } = await supabase.from('public_campaign_stats').select('*').single();
    
    if (error || !data) return console.error('Failed to load stats:', error);

    document.getElementById('campaign-title').textContent = data.campaign_title;
    document.getElementById('campaign-desc').textContent = data.campaign_description;
    if(data.banner_url) document.getElementById('campaign-banner').src = data.banner_url;
    if(data.qr_code_url) document.getElementById('qr-code').src = data.qr_code_url;
    document.getElementById('upi-id').textContent = data.upi_id;

    const collected = Number(data.total_collected);
    const target = Number(data.dynamic_target_amount);
    let percentage = (collected / target) * 100;
    if (percentage > 100) percentage = 100;

    // Trigger width transition for progress bar
    setTimeout(() => {
        document.getElementById('progress-bar').style.width = `${percentage}%`;
    }, 300);

    document.getElementById('donors-count').innerHTML = `<i data-lucide="users" class="w-4 h-4 text-emerald-600"></i> <span>${data.total_donors} Supporters</span>`;
    lucide.createIcons();

    if (data.campaign_type === 'unit_based') {
        const unitsSponsored = Math.floor(collected / data.unit_cost);
        document.getElementById('progress-text').textContent = `${unitsSponsored} ${data.unit_name}s`;
        document.getElementById('target-text').textContent = `Goal: ${data.target_units} ${data.unit_name}s`;
    } else {
        // Use the smooth counting animation
        animateValue(document.getElementById('progress-text'), 0, collected, 2000);
        document.getElementById('target-text').textContent = `Goal: ${formatMoney(target)}`;
    }

    if (percentage === 100) {
        setTimeout(() => {
            confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 }, colors: ['#10b981', '#14b8a6', '#ffffff'] });
        }, 1000);
    }
}

async function loadDonorWall() {
    const { data, error } = await supabase.from('public_donor_wall').select('*').limit(12);
    const wall = document.getElementById('donor-wall');
    
    if (error || !data || data.length === 0) {
        wall.innerHTML = '<p class="text-sm text-slate-500 col-span-2">No public donations yet. Be the first!</p>';
        return;
    }

    wall.innerHTML = data.map((donor, index) => `
        <div class="glass-card p-4 rounded-2xl flex items-center justify-between hover:scale-105 transition-transform duration-300" style="animation-delay: ${index * 50}ms">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-inner">
                    ${donor.donor_name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p class="font-bold text-sm text-slate-800">${donor.donor_name}</p>
                    <p class="text-xs text-slate-500 font-medium">${new Date(donor.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</p>
                </div>
            </div>
            <span class="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">${formatMoney(donor.amount)}</span>
        </div>
    `).join('');
}

document.getElementById('copy-upi').addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('upi-id').textContent);
    Toastify({ 
        text: "✓ UPI ID Copied!", 
        backgroundColor: "#10b981",
        gravity: "top", position: "center"
    }).showToast();
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Processing...';
    lucide.createIcons();

    try {
        let screenshot_url = null;
        const fileInput = document.getElementById('screenshot');
        
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { data: uploadData, error: uploadErr } = await supabase.storage.from('receipts').upload(fileName, file);
            
            if (uploadErr) throw uploadErr;
            
            const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
            screenshot_url = publicUrlData.publicUrl;
        }

        const { error: insertErr } = await supabase.from('donations').insert([{
            donor_name: document.getElementById('donor_name').value,
            phone_number: document.getElementById('phone_number').value,
            amount: document.getElementById('amount').value,
            transaction_ref: document.getElementById('transaction_ref').value,
            donor_wants_public: document.getElementById('donor_wants_public').checked,
            screenshot_url
        }]);

        if (insertErr) throw insertErr;

        Toastify({ 
            text: "🎉 Donation submitted for verification!", 
            backgroundColor: "#10b981", gravity: "top", position: "center" 
        }).showToast();
        form.reset();

    } catch (error) {
        Toastify({ 
            text: "Error submitting form. Try again.", 
            backgroundColor: "#ef4444", gravity: "top", position: "center" 
        }).showToast();
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="send" class="w-5 h-5"></i> Submit for Verification';
        lucide.createIcons();
    }
});

// Init
loadCampaignStats();
loadDonorWall();