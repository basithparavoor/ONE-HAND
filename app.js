import { supabase } from './supabase-client.js';

lucide.createIcons();

const form = document.getElementById('donation-form');
const submitBtn = document.getElementById('submit-btn');

const formatMoney = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

// --- UTILITIES & ANIMATIONS ---

// Smooth number counter
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        obj.innerHTML = formatMoney(Math.floor(easeProgress * (end - start) + start));
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// Client-Side Image Compression
async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200; // Cap width for receipts
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = Math.min(MAX_WIDTH, img.width);
                canvas.height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Compress to 60% quality JPEG
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.6);
            };
        };
    });
}

// Countdown Timer Logic
let endInterval;
function startTimer(endDateString) {
    if(!endDateString) return;
    const endDate = new Date(endDateString).getTime();
    document.getElementById('countdown-container').classList.remove('hidden');
    
    endInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = endDate - now;
        
        if (distance < 0) {
            clearInterval(endInterval);
            document.getElementById('countdown-container').innerHTML = '<p class="text-red-500 font-bold w-full">Campaign Ended</p>';
            return;
        }
        
        document.getElementById('timer-days').innerText = Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
        document.getElementById('timer-hours').innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
        document.getElementById('timer-mins').innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    }, 1000);
}

// --- DATA FETCHING ---

async function loadCampaignStats() {
    const { data, error } = await supabase.from('public_campaign_stats').select('*').single();
    if (error || !data) return console.error('Failed to load stats:', error);

    // Populate Headers & Images
    document.getElementById('campaign-title').textContent = data.campaign_title;
    document.getElementById('campaign-desc').textContent = data.campaign_description;
    if(data.banner_url) document.getElementById('campaign-banner').src = data.banner_url;
    if(data.qr_code_url) document.getElementById('qr-code').src = data.qr_code_url;
    document.getElementById('upi-id').textContent = data.upi_id;

    // Start Timer if end_date exists
    if(data.end_date) startTimer(data.end_date);

    // Progress Calculations
    const collected = Number(data.total_collected);
    const target = Number(data.dynamic_target_amount);
    let percentage = (collected / target) * 100;
    
    // Animate width
    setTimeout(() => {
        document.getElementById('progress-bar').style.width = `${Math.min(percentage, 100)}%`;
    }, 300);

    document.getElementById('donors-count').innerHTML = `<i data-lucide="users" class="w-4 h-4 text-emerald-600"></i> <span>${data.total_donors} Supporters</span>`;
    
    // Check Campaign Type
    if (data.campaign_type === 'unit_based') {
        const unitsSponsored = Math.floor(collected / data.unit_cost);
        document.getElementById('progress-text').textContent = `${unitsSponsored} ${data.unit_name}s`;
        document.getElementById('target-text').textContent = `Goal: ${data.target_units} ${data.unit_name}s`;
    } else {
        animateValue(document.getElementById('progress-text'), 0, collected, 2000);
        document.getElementById('target-text').textContent = `Goal: ${formatMoney(target)}`;
    }

    // Smart Confetti Milestones (Stores in Session so it doesn't trigger on every refresh)
    if(percentage >= 25 && percentage < 50 && !sessionStorage.getItem('m25')) { confetti(); sessionStorage.setItem('m25', 'true'); }
    if(percentage >= 50 && percentage < 75 && !sessionStorage.getItem('m50')) { confetti({ particleCount: 100, spread: 70 }); sessionStorage.setItem('m50', 'true'); }
    if(percentage >= 75 && percentage < 100 && !sessionStorage.getItem('m75')) { confetti({ particleCount: 150, spread: 80 }); sessionStorage.setItem('m75', 'true'); }
    if(percentage >= 100 && !sessionStorage.getItem('m100')) { 
        setTimeout(() => confetti({ particleCount: 250, spread: 100, origin: {y: 0.6}, colors: ['#10b981', '#14b8a6', '#ffffff'] }), 1000); 
        sessionStorage.setItem('m100', 'true'); 
    }
    
    lucide.createIcons();
}

async function loadDonors(type = 'recent') {
    const viewName = type === 'recent' ? 'public_donor_wall' : 'public_top_donors';
    const { data, error } = await supabase.from(viewName).select('*').limit(15);
    const wall = document.getElementById('donor-wall');
    
    if (error || !data || data.length === 0) {
        wall.innerHTML = '<div class="glass-card p-6 rounded-2xl text-center"><p class="text-sm text-slate-500">No public donations yet. Be the first to support!</p></div>';
        return;
    }

    wall.innerHTML = data.map((d, index) => `
        <div class="glass-card p-5 rounded-2xl animate-fade-in-up border border-white/60 hover:shadow-lg transition-all duration-300" style="animation-delay: ${index * 50}ms">
            <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-bold text-xl shadow-inner">
                        ${d.donor_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p class="font-bold text-slate-900 flex items-center gap-1.5 text-base">
                            ${d.donor_name}
                            <i data-lucide="badge-check" class="w-4 h-4 text-blue-500 fill-blue-50" title="Verified Donation"></i>
                        </p>
                        <p class="text-xs text-slate-500 font-medium">${new Date(d.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</p>
                    </div>
                </div>
                <span class="font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 text-lg">${formatMoney(d.amount)}</span>
            </div>
            
            ${d.donor_message ? `
                <div class="mt-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex gap-2 items-start">
                    <i data-lucide="quote" class="w-4 h-4 text-slate-300 shrink-0 mt-0.5"></i>
                    <p class="text-sm text-slate-600 italic leading-relaxed">"${d.donor_message}"</p>
                </div>
            ` : ''}
        </div>
    `).join('');
    
    lucide.createIcons();
}

// --- EVENT LISTENERS ---

// Tabs Logic
const tabRecent = document.getElementById('tab-recent');
const tabTop = document.getElementById('tab-top');

tabRecent.addEventListener('click', () => {
    tabRecent.className = 'pb-3 text-lg font-bold border-b-2 border-emerald-500 text-emerald-700 transition-colors flex items-center gap-2';
    tabTop.className = 'pb-3 text-lg font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2';
    loadDonors('recent');
});

tabTop.addEventListener('click', () => {
    tabTop.className = 'pb-3 text-lg font-bold border-b-2 border-emerald-500 text-emerald-700 transition-colors flex items-center gap-2';
    tabRecent.className = 'pb-3 text-lg font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2';
    loadDonors('top');
});

// Copy UPI Logic
document.getElementById('copy-upi').addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('upi-id').textContent);
    Toastify({ text: "✓ UPI ID Copied!", backgroundColor: "#10b981", gravity: "top" }).showToast();
});

// Form Submission Logic
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Uploading...';
    lucide.createIcons();

    try {
        let screenshot_url = null;
        const fileInput = document.getElementById('screenshot');
        
        if (fileInput.files.length > 0) {
            // Compress Image Before Upload
            const compressedFile = await compressImage(fileInput.files[0]);
            const fileName = `${Date.now()}.jpg`; // Force jpg extension after compression
            
            const { data: uploadData, error: uploadErr } = await supabase.storage.from('receipts').upload(fileName, compressedFile);
            if (uploadErr) throw uploadErr;
            
            screenshot_url = supabase.storage.from('receipts').getPublicUrl(fileName).data.publicUrl;
        }

        const amt = document.getElementById('amount').value;
        const donorName = document.getElementById('donor_name').value;

        // Insert to DB
        const { error: insertErr } = await supabase.from('donations').insert([{
            donor_name: donorName,
            phone_number: document.getElementById('phone_number').value,
            amount: amt,
            transaction_ref: document.getElementById('transaction_ref').value,
            donor_message: document.getElementById('donor_message').value,
            donor_wants_public: document.getElementById('donor_wants_public').checked,
            screenshot_url
        }]);

        if (insertErr) throw insertErr;

        // Prepare WhatsApp Share Button in Modal
        const shareMsg = `I just supported the SSF West Bengal Educational Drive with ₹${amt}! Join me in making a difference: ${window.location.href}`;
        document.getElementById('wa-share-btn').href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMsg)}`;
        
        // Show Success Modal & Pop animation
        const modal = document.getElementById('success-modal');
        modal.classList.remove('hidden');
        setTimeout(() => document.getElementById('success-modal-content').classList.remove('scale-95'), 10);
        
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
        form.reset();

    } catch (error) {
        Toastify({ text: "Error submitting form. Try again.", backgroundColor: "#ef4444", gravity: "top" }).showToast();
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="send" class="w-5 h-5"></i> Submit for Verification';
        lucide.createIcons();
    }
});

// Init on Page Load
loadCampaignStats();
loadDonors('recent');