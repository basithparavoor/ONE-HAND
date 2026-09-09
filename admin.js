import { supabase } from './supabase-client.js';

if (typeof lucide !== 'undefined') lucide.createIcons();

let currentDonations = [];
let siteContent = null;

const formatMoney = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

// --- ALL INDIAN STATES & DISTRICTS ---
const indiaData = {
    "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
    "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Prakasam", "SPSR Nellore", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
    "Arunachal Pradesh": ["Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"],
    "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
    "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
    "Chandigarh": ["Chandigarh"],
    "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
    "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
    "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
    "Goa": ["North Goa", "South Goa"],
    "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
    "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
    "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
    "Jammu and Kashmir": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
    "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Saraikela-Kharsawan", "Simdega", "West Singhbhum"],
    "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
    "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
    "Ladakh": ["Kargil", "Leh"],
    "Lakshadweep": ["Lakshadweep"],
    "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Niwari", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
    "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
    "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
    "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
    "Mizoram": ["Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip"],
    "Nagaland": ["Chumukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
    "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
    "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"],
    "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Shahid Bhagat Singh Nagar", "Tarn Taran"],
    "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
    "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
    "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
    "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"],
    "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
    "Uttar Pradesh": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Badaun", "Baghpat", "Bahraich", "Balia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
    "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
    "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"]
};

// --- AUTH ---
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        document.getElementById('login-section')?.classList.add('hidden');
        document.getElementById('dashboard-section')?.classList.remove('hidden');
        loadData();
    } else {
        document.getElementById('login-section')?.classList.remove('hidden');
        document.getElementById('dashboard-section')?.classList.add('hidden');
    }
});

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    if(btn) btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Authenticating...';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    const { error } = await supabase.auth.signInWithPassword({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    });
    
    if (error) {
        Toastify({ text: "Authentication Failed", style: { background: "#ef4444" } }).showToast();
        if(btn) btn.innerHTML = '<i data-lucide="log-in" class="w-5 h-5"></i> Secure Login';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
});

document.getElementById('logout-btn')?.addEventListener('click', () => supabase.auth.signOut());

// --- MOBILE MENU TOGGLE ---
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');

function toggleSidebar() {
    if(!sidebar || !sidebarOverlay) return;
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        sidebarOverlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
    }
}
mobileMenuBtn?.addEventListener('click', toggleSidebar);
sidebarOverlay?.addEventListener('click', toggleSidebar);

// --- TAB ROUTING (FIXED FLEXBOX ISSUE) ---
function switchTab(activeKey) {
    const tabs = ['overview', 'verify', 'offline', 'cms', 'poster'];
    
    tabs.forEach(key => {
        const content = document.getElementById(`tab-${key}`);
        const btn = document.getElementById(`nav-${key}`);
        
        if(content) {
            if (key === activeKey) {
                content.classList.remove('hidden');
                // Crucial fix: Inject flex to prevent container collapsing
                if (key === 'poster' || key === 'verify') content.classList.add('flex');
            } else {
                content.classList.add('hidden');
                content.classList.remove('flex');
            }
        }
        
        if(btn) {
            btn.className = key === activeKey 
                ? 'w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800 text-white font-medium shadow-sm transition-all'
                : 'w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 font-medium text-slate-400 transition-colors';
            
            const icon = btn.querySelector('i');
            if(icon) {
                if(key === activeKey) icon.classList.add('text-emerald-400');
                else icon.classList.remove('text-emerald-400');
            }
        }
    });

    if(window.innerWidth < 768 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
        toggleSidebar();
    }
}

['overview', 'verify', 'offline', 'cms', 'poster'].forEach(k => {
    document.getElementById(`nav-${k}`)?.addEventListener('click', () => switchTab(k));
});

// --- LOCATIONS & FILTERS ---
function setupAdminLocations() {
    const selects = [
        { s: document.getElementById('f_state'), d: document.getElementById('f_district') },
        { s: document.getElementById('off_state'), d: document.getElementById('off_district') }
    ];
    
    Object.keys(indiaData).sort().forEach(state => {
        selects.forEach(group => { if(group.s) group.s.innerHTML += `<option value="${state}">${state}</option>`; });
    });

    selects.forEach(group => {
        if(group.s && group.d) {
            group.s.addEventListener('change', (e) => {
                group.d.innerHTML = '<option value="all">All Districts</option>';
                if(e.target.value !== 'all' && indiaData[e.target.value]) {
                    group.d.disabled = false; group.d.classList.remove('opacity-50');
                    indiaData[e.target.value].sort().forEach(dist => group.d.innerHTML += `<option value="${dist}">${dist}</option>`);
                } else {
                    group.d.disabled = true; group.d.classList.add('opacity-50');
                }
                if(group.s.id === 'f_state') renderTable();
            });
            if(group.d.id === 'f_district') group.d.addEventListener('change', renderTable);
        }
    });
}
['f_search', 'f_status', 'f_msg', 'f_date_from', 'f_date_to'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderTable);
});

// --- CORE DATA FETCHING & REALTIME ---
async function loadData() {
    const [donationsRes, cmsRes] = await Promise.all([
        supabase.from('donations').select('*').order('created_at', { ascending: false }),
        supabase.from('site_content').select('*').single()
    ]);
    currentDonations = donationsRes.data || [];
    siteContent = cmsRes.data || {};
    
    injectCustomFonts();
    updateAnalytics();
    renderTable();
    populateCMSForms();
    initGraphicsStudio();

    // LIVE SUPABASE SUBSCRIPTION
    supabase.channel('admin_donations_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, (payload) => {
            if (payload.eventType === 'INSERT') {
                // Flag it as new so the table can animate it
                payload.new.is_new = true; 
                currentDonations.unshift(payload.new);
                Toastify({ text: "New Donation Received!", style: { background: "#10b981" } }).showToast();
                
                // Remove the highlight flag after 3 seconds
                setTimeout(() => { delete payload.new.is_new; renderTable(); }, 3000);
            } else if (payload.eventType === 'UPDATE') {
                const idx = currentDonations.findIndex(d => d.id === payload.new.id);
                if (idx !== -1) currentDonations[idx] = payload.new;
            } else if (payload.eventType === 'DELETE') {
                currentDonations = currentDonations.filter(d => d.id !== payload.old.id);
            }
            updateAnalytics();
            renderTable();
        })
        .subscribe();
}

function updateAnalytics() {
    const verified = currentDonations.filter(d => d.is_verified);
    const totalRaised = verified.reduce((sum, d) => sum + Number(d.amount), 0);
    
    const rEl = document.getElementById('stat-total-raised');
    if(rEl) rEl.textContent = formatMoney(totalRaised);
    const sEl = document.getElementById('stat-students');
    if(sEl) sEl.textContent = Math.floor(totalRaised / (siteContent.unit_cost || 1));
    const pEl = document.getElementById('stat-pending-count');
    if(pEl) pEl.textContent = currentDonations.filter(d => !d.is_verified).length;
}

function injectCustomFonts() {
    const fonts = siteContent.custom_fonts || [];
    let css = fonts.map(f => `@font-face { font-family: '${f.name}'; src: url('${f.url}'); }`).join('\n');
    document.getElementById('custom-fonts-style').innerHTML = css;
    
    const sel = document.getElementById('prop_font');
    if(sel) {
        sel.innerHTML = '<option value="Inter">Inter (Default)</option><option value="Arial">Arial</option><option value="Times New Roman">Times New Roman</option>';
        fonts.forEach(f => sel.innerHTML += `<option value="${f.name}">${f.name}</option>`);
    }
}

// --- ADVANCED TABLE & UTR VERIFICATION ---
function renderTable() {
    const tbody = document.getElementById('donations-tbody');
    if(!tbody) return;

    const search = (document.getElementById('f_search')?.value || '').toLowerCase();
    const state = document.getElementById('f_state')?.value || 'all';
    const dist = document.getElementById('f_district')?.value || 'all';
    const status = document.getElementById('f_status')?.value || 'all';
    const msgFilter = document.getElementById('f_msg')?.value || 'all';
    const dFrom = document.getElementById('f_date_from')?.value;
    const dTo = document.getElementById('f_date_to')?.value;

    const filtered = currentDonations.filter(d => {
        if (search && !d.donor_name.toLowerCase().includes(search) && !(d.phone_number||'').includes(search) && !(d.transaction_ref||'').toLowerCase().includes(search)) return false;
        if (state !== 'all' && d.state !== state) return false;
        if (dist !== 'all' && d.district !== dist) return false;
        if (status === 'verified' && !d.is_verified) return false;
        if (status === 'pending' && d.is_verified) return false;
        if (msgFilter === 'sent' && !d.msg_sent) return false;
        if (msgFilter === 'unsent' && d.msg_sent) return false;
        
        const dDate = new Date(d.created_at);
        if (dFrom && dDate < new Date(dFrom)) return false;
        if (dTo && dDate > new Date(dTo + 'T23:59:59')) return false;
        return true;
    });

    tbody.innerHTML = filtered.map(d => {
        const dDate = new Date(d.created_at);
        const formatPhone = d.phone_number ? `<p class="text-xs text-slate-500 font-mono mt-1"><i data-lucide="phone" class="w-3 h-3 inline"></i> ${d.phone_number}</p>` : '';
        const utrString = d.transaction_ref && d.transaction_ref !== 'null' ? d.transaction_ref : '';
        const hasMsg = d.donor_message && d.donor_message.trim() !== '';
        
       return `
        <tr class="transition-colors group border-b border-slate-100 ${d.is_new ? 'bg-emerald-50 animate-pulse' : 'hover:bg-slate-50/80'}">
            <td class="p-4 align-top">
                <p class="font-extrabold text-slate-900 text-sm">${d.donor_name}</p>
                ${formatPhone}
                <p class="text-[10px] text-slate-400 mt-1">${dDate.toLocaleDateString()} at ${dDate.toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}</p>
                ${hasMsg ? `<button onclick="viewMessage('${d.id}')" class="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md hover:bg-indigo-100 transition-colors"><i data-lucide="message-square-quote" class="w-3 h-3"></i> Read Message</button>` : ''}
            </td>
            <td class="p-4 align-top">
                <p class="text-sm font-bold text-slate-700">${d.place || '-'}</p>
                <p class="text-xs text-slate-500">${d.district ? d.district+', ' : ''}${d.state || '-'}</p>
            </td>
            <td class="p-4 align-top">
                <p class="font-black text-emerald-600 text-base">₹${d.amount}</p>
                <p class="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${d.is_offline ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}">
                    ${d.is_offline ? 'OFFLINE' : 'UTR: ' + (utrString || 'Not Set')}
                </p>
            </td>
            <td class="p-4 text-center align-top space-y-2">
                ${d.is_verified ? `
                    <button onclick="processWhatsAppReceipt('${d.id}')" class="w-full justify-center px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center gap-1.5 mx-auto ${d.msg_sent ? 'bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/20' : 'bg-slate-900 text-white hover:bg-slate-800'}">
                        <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> ${d.msg_sent ? 'Resend WA' : 'WA Receipt'}
                    </button>
                    <button onclick="downloadPoster('${d.id}')" class="w-full justify-center px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center gap-1.5 mx-auto bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                        <i data-lucide="download" class="w-3.5 h-3.5"></i> Get Poster
                    </button>
                    ${d.receipt_number ? `<p class="text-[9px] text-slate-400 font-mono mt-1">Rec: #${d.receipt_number}</p>` : ''}
                ` : '<span class="text-xs text-slate-400 italic">Verify first</span>'}
            </td>
            <td class="p-4 text-right align-top">
                <div class="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    ${!d.is_verified 
                        ? `<button onclick="openVerifyModal('${d.id}', '${utrString}')" class="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-sm" title="Verify Payment"><i data-lucide="check" class="w-4 h-4"></i></button>` 
                        : `<button onclick="openVerifyModal('${d.id}', '${utrString}')" class="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 shadow-sm" title="Edit UTR"><i data-lucide="edit-3" class="w-4 h-4"></i></button>`}
                    <button onclick="deleteDonation('${d.id}')" class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Delete"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        </tr>
    `}).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.viewMessage = (id) => {
    const d = currentDonations.find(x => x.id === id);
    if(!d) return;
    document.getElementById('msg-modal-name').textContent = d.donor_name;
    document.getElementById('msg-modal-date').textContent = new Date(d.created_at).toLocaleString();
    document.getElementById('msg-modal-text').textContent = `"${d.donor_message}"`;
    document.getElementById('message-modal').classList.remove('hidden');
};

window.openVerifyModal = (id, currentUtr) => {
    document.getElementById('verify_id').value = id;
    document.getElementById('verify_utr').value = currentUtr || '';
    document.getElementById('verify-utr-modal').classList.remove('hidden');
};

window.submitVerification = async () => {
    const id = document.getElementById('verify_id').value;
    const utr = document.getElementById('verify_utr').value.trim();
    const btn = document.getElementById('btn-confirm-verify');
    
    if (utr) {
        const duplicate = currentDonations.find(d => d.transaction_ref === utr && d.id !== id);
        if (duplicate && !confirm(`Warning! UTR ${utr} is already associated with a donation by ${duplicate.donor_name}. Do you want to proceed anyway?`)) return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin inline-block"></i> Saving...';
    btn.disabled = true;
    if(typeof lucide !== 'undefined') lucide.createIcons();

    const existingDonation = currentDonations.find(d => d.id === id);
    const updateData = { transaction_ref: utr || null };
    
    if (!existingDonation.is_verified) {
        updateData.is_verified = true;
        updateData.verified_at = new Date();
        updateData.is_published_by_admin = true;
    }

    await supabase.from('donations').update(updateData).eq('id', id);
    Toastify({ text: existingDonation.is_verified ? "UTR Updated Successfully" : "Donation Verified Successfully", style: { background: "#10b981" } }).showToast();
    document.getElementById('verify-utr-modal').classList.add('hidden');
    
    btn.innerHTML = originalText;
    btn.disabled = false;
    loadData();
};

window.deleteDonation = async (id) => {
    if(confirm("Permanently delete this donation?")) { 
        await supabase.from('donations').delete().eq('id', id); 
        loadData(); 
    }
};

// --- GRAPHICS & WHATSAPP ENGINE ---
window.downloadPoster = async (id) => {
    const donation = currentDonations.find(d => d.id === id);
    if(!donation) return;
    
    Toastify({ text: "Generating Poster...", style: { background: "#10b981" } }).showToast();

    const canvas = document.getElementById('hidden-poster-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const config = siteContent.poster_config || { width: 600, height: 800, elements: [] };
    canvas.width = config.width || 600;
    canvas.height = config.height || 800;
    
    ctx.fillStyle = '#ffffff'; 
    ctx.fillRect(0,0, canvas.width, canvas.height);
    
    const drawContent = () => {
        if(config.elements) {
            config.elements.forEach(el => {
                let textToDraw = el.text;
                if(el.fieldKey === 'donor_name') textToDraw = donation.donor_name;
                if(el.fieldKey === 'amount') textToDraw = `₹${donation.amount}`;
                if(el.fieldKey === 'state') textToDraw = donation.state || '';
                if(el.fieldKey === 'district') textToDraw = donation.district || '';
                if(el.fieldKey === 'place') textToDraw = donation.place || '';
                if(el.fieldKey === 'date') textToDraw = new Date(donation.created_at).toLocaleDateString();
                if(el.fieldKey === 'time') textToDraw = new Date(donation.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                if(el.fieldKey === 'receipt_no') textToDraw = donation.receipt_number ? `No: ${donation.receipt_number}` : '';

                ctx.font = `${el.italic?'italic ':''}${el.bold?'bold ':''}${el.size || 30}px "${el.font || 'Inter'}"`;
                ctx.fillStyle = el.color || '#000000';
                ctx.textAlign = el.align || 'center';
                ctx.fillText(textToDraw, el.x, el.y);
            });
        }

        const link = document.createElement('a');
        link.download = `SSF_Poster_${donation.donor_name.replace(/\s/g, '_')}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
    };

    if(siteContent.poster_bg_url) {
        const img = new Image(); 
        if (!siteContent.poster_bg_url.startsWith('data:')) img.crossOrigin = "Anonymous"; 
        img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); drawContent(); };
        img.onerror = () => { console.error("Poster BG failed to load."); drawContent(); };
        img.src = siteContent.poster_bg_url;
    } else {
        drawContent(); 
    }
};

// --- WHATSAPP RECEIPT ENGINE ---
window.processWhatsAppReceipt = async (id) => {
    const donation = currentDonations.find(d => d.id === id);
    if(!donation || !donation.phone_number) return Toastify({ text: "No phone number attached.", style: {background: "#ef4444"} }).showToast();

    Toastify({ text: "Generating Official Receipt...", style: { background: "#3b82f6" } }).showToast();

    let recNo = donation.receipt_number;
    if(!recNo) {
        const maxRec = currentDonations.reduce((max, d) => (d.receipt_number > max ? d.receipt_number : max), 999);
        recNo = maxRec + 1;
        await supabase.from('donations').update({ receipt_number: recNo }).eq('id', id);
        donation.receipt_number = recNo;
    }

    const canvas = document.getElementById('hidden-receipt-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const config = siteContent.receipt_config || { width: 600, height: 800, elements: [] };
    canvas.width = config.width || 600;
    canvas.height = config.height || 800;
    
    ctx.fillStyle = '#ffffff'; 
    ctx.fillRect(0,0, canvas.width, canvas.height);
    
    const drawContent = async () => {
        if(config.elements) {
            config.elements.forEach(el => {
                let textToDraw = el.text;
                if(el.fieldKey === 'donor_name') textToDraw = donation.donor_name;
                if(el.fieldKey === 'amount') textToDraw = `₹${donation.amount}`;
                if(el.fieldKey === 'state') textToDraw = donation.state || '';
                if(el.fieldKey === 'district') textToDraw = donation.district || '';
                if(el.fieldKey === 'place') textToDraw = donation.place || '';
                if(el.fieldKey === 'date') textToDraw = new Date(donation.created_at).toLocaleDateString();
                if(el.fieldKey === 'time') textToDraw = new Date(donation.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                if(el.fieldKey === 'receipt_no') textToDraw = `No: ${recNo}`;

                ctx.font = `${el.italic?'italic ':''}${el.bold?'bold ':''}${el.size || 30}px "${el.font || 'Inter'}"`;
                ctx.fillStyle = el.color || '#000000';
                ctx.textAlign = el.align || 'center';
                ctx.fillText(textToDraw, el.x, el.y);
            });
        }

        canvas.toBlob(async (blob) => {
            const fileName = `SSF_Receipt_${recNo}.jpg`;
            const { data, error } = await supabase.storage.from('receipts').upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: true
            });
            
            if(error) return Toastify({ text: "Upload failed", style: {background: "#ef4444"} }).showToast();
            
            // CLEAN ROOT URL FORMAT (e.g., domain.com/receipt.html?1042)
            const proLink = `${window.location.origin}/receipt.html?${recNo}`;
            
            await supabase.from('donations').update({ msg_sent: true }).eq('id', id);
            
            let template = siteContent.wa_template || "Thank you {name} for ₹{amount}. Receipt: {receipt_url}";
            template = template.replaceAll('{name}', donation.donor_name)
                               .replaceAll('{amount}', donation.amount)
                               .replaceAll('{receipt_url}', proLink);
            
            let waNum = donation.phone_number.replace(/\D/g,'');
            if(waNum.length === 10) waNum = '91' + waNum;
            window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(template)}`, '_blank');
            
            loadData(); 
        }, 'image/jpeg', 0.8);
    };

    if(siteContent.receipt_bg_url) {
        const img = new Image(); 
        if (!siteContent.receipt_bg_url.startsWith('data:')) img.crossOrigin = "Anonymous"; 
        img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); drawContent(); };
        img.onerror = () => { console.error("Receipt BG failed to load, bypassing."); drawContent(); };
        img.src = siteContent.receipt_bg_url;
    } else {
        drawContent(); 
    }
};

// --- PREMIUM PDF GENERATION SETUP ---
const applyPremiumPDFHeader = (doc, title, subtitle) => {
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(siteContent.campaign_title || "SSF Trust Campaign", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(title, 14, 28);
    doc.setTextColor(100, 116, 139); 
    doc.setFontSize(9);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 45);
    if(subtitle) doc.text(subtitle, 14, 51);
};

document.getElementById('btn-export-csv')?.addEventListener('click', () => {
    if(!currentDonations.length) return;
    const headers = "Date,Receipt No,Name,Phone,State,Amount,Source,Status\n";
    const rows = currentDonations.map(d => 
        `"${new Date(d.created_at).toLocaleDateString()}","${d.receipt_number||''}","${d.donor_name}","${d.phone_number||''}","${d.state||''}","${d.amount}","${d.is_offline ? 'Offline' : 'Online'}","${d.is_verified ? 'Verified' : 'Pending'}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `SSF_Report_${Date.now()}.csv`; a.click();
});

document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
    if(!window.jspdf) return Toastify({ text: "PDF Engine Loading...", style: {background: "#ef4444"} }).showToast();
    const doc = new window.jspdf.jsPDF();
    
    applyPremiumPDFHeader(doc, "Official Donation Ledger", `Total Records: ${currentDonations.length}`);
    
    const tableData = currentDonations.map(d => [
        new Date(d.created_at).toLocaleDateString(),
        d.receipt_number || '-',
        d.donor_name,
        d.phone_number || '-',
        `Rs. ${d.amount}`,
        d.is_verified ? 'Verified' : 'Pending'
    ]);

    doc.autoTable({
        startY: 56,
        head: [['Date', 'Receipt No', 'Donor Name', 'Phone', 'Amount', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' }, 
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 9, cellPadding: 4 }
    });

    doc.save(`SSF_Donation_Report_${Date.now()}.pdf`);
});

document.getElementById('btn-export-msg')?.addEventListener('click', () => {
    if(!window.jspdf) return Toastify({ text: "PDF Engine Loading...", style: {background: "#ef4444"} }).showToast();
    
    const msgs = currentDonations.filter(d => d.donor_message && d.donor_message.trim() !== '');
    if(!msgs.length) return Toastify({text: "No donor messages to export.", style: {background: "#ef4444"}}).showToast();

    const doc = new window.jspdf.jsPDF();
    applyPremiumPDFHeader(doc, "Donor Messages Report", `Total Messages: ${msgs.length}`);
    
    const tableData = msgs.map(d => [
        new Date(d.created_at).toLocaleDateString(),
        d.donor_name,
        d.donor_message
    ]);

    doc.autoTable({
        startY: 56,
        head: [['Date', 'Donor Name', 'Attached Message']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' }, 
        bodyStyles: { textColor: 50 },
        columnStyles: { 2: { cellWidth: 100 } },
        styles: { fontSize: 9, cellPadding: 5, overflow: 'linebreak' }
    });

    doc.save(`SSF_Donor_Messages_${Date.now()}.pdf`);
});

// --- OFFLINE ENTRY ---
document.getElementById('offline-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await supabase.from('donations').insert([{
        donor_name: document.getElementById('off_name')?.value || '',
        amount: document.getElementById('off_amount')?.value || 0,
        phone_number: document.getElementById('off_phone')?.value || null,
        state: document.getElementById('off_state')?.value || '',
        district: document.getElementById('off_district')?.value || '',
        place: document.getElementById('off_place')?.value || '',
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

// --- CMS & CONFIG SETUP ---
function populateCMSForms() {
    if(!siteContent) return;
    
    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
    
    setVal('cms_title', siteContent.campaign_title || '');
    setVal('cms_header', siteContent.header_text || '');
    setVal('cms_desc', siteContent.campaign_description || '');
    setVal('cms_target_units', siteContent.target_units || '');
    setVal('cms_unit_cost', siteContent.unit_cost || '');
    setVal('cms_upi', siteContent.upi_id || '');
    setVal('cms_thankyou', siteContent.thank_you_message || '');
    setVal('cms_wa_template', siteContent.wa_template || '');
    setVal('cms_donor_share', siteContent.donor_share_template || '');
    
    if(siteContent.end_date) {
        const date = new Date(siteContent.end_date);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        setVal('cms_end_date', date.toISOString().slice(0,16));
    }
}

document.getElementById('cms-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-cms');
    if(btn) { btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Saving...'; btn.disabled = true; }
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
        wa_template: document.getElementById('cms_wa_template')?.value || '',
        donor_share_template: document.getElementById('cms_donor_share')?.value || '',
        logo_url: logo_url,
        banner_url: banner_url
    }).eq('id', 1);

    if (error) {
        Toastify({ text: "Error Saving Settings", style: { background: "#ef4444" } }).showToast();
    } else {
        Toastify({ text: "CMS Saved Successfully", style: { background: "#10b981" } }).showToast();
    }
    
    if(btn) { btn.innerHTML = 'Save Settings'; btn.disabled = false; }
    loadData();
});

// --- LIVE GRAPHICS STUDIO (Drag & Drop Canvas with Mathematical Resizing Engine) ---
let currentGfxModeStudio = 'poster';
let gfxState = { width: 600, height: 800, elements: [], bg_url: null };
let selectedElementId = null;
let bgImageObj = null;

const canvasStudio = document.getElementById('studio-canvas');
const ctxStudio = canvasStudio ? canvasStudio.getContext('2d') : null;
let isDragging = false;
let dragOffsetX = 0; let dragOffsetY = 0;
let currentRenderScale = 1; 

function initGraphicsStudio() {
    document.fonts.ready.then(() => {
        switchGfxMode('poster');
    });
    
    // Resize Observer for bulletproof window resizing
    const workspace = document.getElementById('canvas-workspace');
    if (workspace) {
        new ResizeObserver(() => {
            if (workspace.clientWidth > 0) renderStudioCanvas();
        }).observe(workspace);
    }
}

function switchGfxMode(mode) {
    currentGfxModeStudio = mode;
    
    const btnPoster = document.getElementById('mode-poster');
    const btnReceipt = document.getElementById('mode-receipt');
    
    if(btnPoster) btnPoster.className = mode === 'poster' ? 'flex-1 py-2.5 rounded-lg bg-white shadow-sm text-emerald-700 transition-all border border-slate-200/50 font-bold' : 'flex-1 py-2.5 rounded-lg text-slate-500 hover:text-slate-700 transition-all font-medium';
    if(btnReceipt) btnReceipt.className = mode === 'receipt' ? 'flex-1 py-2.5 rounded-lg bg-white shadow-sm text-emerald-700 transition-all border border-slate-200/50 font-bold' : 'flex-1 py-2.5 rounded-lg text-slate-500 hover:text-slate-700 transition-all font-medium';
    
    const rawConf = mode === 'poster' ? siteContent.poster_config : siteContent.receipt_config;
    
    if(rawConf && Array.isArray(rawConf.elements)) {
        gfxState = JSON.parse(JSON.stringify(rawConf));
    } else {
        gfxState = { width: 600, height: 800, elements: [] };
    }
    
    gfxState.bg_url = mode === 'poster' ? siteContent.poster_bg_url : siteContent.receipt_bg_url;
    
    document.getElementById('gfx_w').value = gfxState.width || 600;
    document.getElementById('gfx_h').value = gfxState.height || 800;
    
    selectedElementId = null;
    loadStudioBgImage();
}

document.getElementById('mode-poster')?.addEventListener('click', () => switchGfxMode('poster'));
document.getElementById('mode-receipt')?.addEventListener('click', () => switchGfxMode('receipt'));

// Live Local Upload Preview Fix
document.getElementById('gfx_bg_file')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            gfxState.bg_url = event.target.result; 
            loadStudioBgImage(); 
        };
        reader.readAsDataURL(file);
    }
});

function loadStudioBgImage() {
    if(!gfxState.bg_url) { 
        bgImageObj = null; 
        renderStudioCanvas(); 
        return; 
    }
    bgImageObj = new Image(); 
    if (!gfxState.bg_url.startsWith('data:')) {
        bgImageObj.crossOrigin = "Anonymous"; 
    }
    bgImageObj.onload = () => { renderStudioCanvas(); };
    bgImageObj.onerror = () => { bgImageObj = null; renderStudioCanvas(); };
    bgImageObj.src = gfxState.bg_url;
}

['gfx_w', 'gfx_h'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', (e) => {
        if(id==='gfx_w') gfxState.width = Number(e.target.value);
        if(id==='gfx_h') gfxState.height = Number(e.target.value);
        renderStudioCanvas();
    });
});

document.getElementById('btn-add-element')?.addEventListener('click', () => {
    const type = document.getElementById('gfx_add_field').value;
    const map = { donor_name:"JANE DOE", amount:"₹1000", state:"KERALA", district:"KOCHI", place:"TOWN", date:"12/10/2026", time:"14:30", receipt_no:"REC-1042" };
    
    const newEl = {
        id: 'el_' + Date.now(),
        fieldKey: type,
        text: type === 'custom' ? 'Custom Text' : (map[type] || "Text"),
        x: gfxState.width / 2, y: gfxState.height / 2,
        size: 30, color: '#000000', align: 'center', font: 'Inter', bold: true, italic: false
    };
    gfxState.elements.push(newEl);
    selectedElementId = newEl.id;
    updatePropsPanel();
    renderStudioCanvas();
});

if(canvasStudio) {
    canvasStudio.addEventListener('mousedown', (e) => {
        const rect = canvasStudio.getBoundingClientRect();
        
        const scaleX = canvasStudio.width / rect.width;
        const scaleY = canvasStudio.height / rect.height;
        
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        for (let i = gfxState.elements.length - 1; i >= 0; i--) {
            let el = gfxState.elements[i];
            ctxStudio.font = `${el.italic?'italic ':''}${el.bold?'bold ':''}${el.size || 30}px "${el.font || 'Inter'}"`;
            let m = ctxStudio.measureText(el.text || '');
            let w = m.width; let h = el.size || 30;
            let x = el.x;
            if (el.align === 'center') x -= w/2;
            if (el.align === 'right') x -= w;

            if (mx >= x-10 && mx <= x+w+10 && my >= el.y-h-5 && my <= el.y+10) {
                selectedElementId = el.id;
                isDragging = true;
                dragOffsetX = mx - el.x;
                dragOffsetY = my - el.y;
                updatePropsPanel(); 
                renderStudioCanvas(); 
                return;
            }
        }
        selectedElementId = null; 
        updatePropsPanel(); 
        renderStudioCanvas();
    });

    canvasStudio.addEventListener('mousemove', (e) => {
        if (!isDragging || !selectedElementId) return;
        const rect = canvasStudio.getBoundingClientRect();
        const scaleX = canvasStudio.width / rect.width;
        const scaleY = canvasStudio.height / rect.height;
        
        let el = gfxState.elements.find(e => e.id === selectedElementId);
        el.x = ((e.clientX - rect.left) * scaleX) - dragOffsetX;
        el.y = ((e.clientY - rect.top) * scaleY) - dragOffsetY;
        renderStudioCanvas();
    });

    canvasStudio.addEventListener('mouseup', () => isDragging = false);
    canvasStudio.addEventListener('mouseleave', () => isDragging = false);
}

function renderStudioCanvas() {
    if(!canvasStudio || !ctxStudio) return;
    
    canvasStudio.width = gfxState.width || 600;
    canvasStudio.height = gfxState.height || 800;

    const workspace = document.getElementById('canvas-workspace');
    const wrapper = document.getElementById('canvas-wrapper');
    const scaleIndicator = document.getElementById('preview-scale-indicator');

    if(workspace && wrapper) {
        if(workspace.clientWidth === 0) return; // Wait until container opens

        const maxWidth = Math.max(workspace.clientWidth - 60, 200);
        const maxHeight = Math.max(workspace.clientHeight - 80, 200);
        
        const scaleX = maxWidth / (canvasStudio.width || 1);
        const scaleY = maxHeight / (canvasStudio.height || 1);
        currentRenderScale = Math.min(scaleX, scaleY, 1); 

        const finalWidth = canvasStudio.width * currentRenderScale;
        const finalHeight = canvasStudio.height * currentRenderScale;

        wrapper.style.width = `${finalWidth}px`;
        wrapper.style.height = `${finalHeight}px`;

        if(scaleIndicator) {
            scaleIndicator.textContent = `Scale: ${Math.round(currentRenderScale * 100)}%`;
        }
    }

    ctxStudio.fillStyle = '#ffffff'; 
    ctxStudio.fillRect(0,0, canvasStudio.width, canvasStudio.height);
    
    if(bgImageObj && bgImageObj.complete && bgImageObj.naturalWidth !== 0) {
        ctxStudio.drawImage(bgImageObj, 0, 0, canvasStudio.width, canvasStudio.height);
    }

    if(gfxState.elements) {
        gfxState.elements.forEach(el => {
            ctxStudio.font = `${el.italic?'italic ':''}${el.bold?'bold ':''}${el.size || 30}px "${el.font || 'Inter'}"`;
            ctxStudio.fillStyle = el.color || '#000000'; 
            ctxStudio.textAlign = el.align || 'center';
            ctxStudio.fillText(el.text || '', el.x, el.y);

            if (el.id === selectedElementId) {
                let m = ctxStudio.measureText(el.text || '');
                let w = m.width; let h = el.size || 30;
                let x = el.x;
                if (el.align === 'center') x -= w/2;
                if (el.align === 'right') x -= w;
                
                ctxStudio.strokeStyle = '#3b82f6'; ctxStudio.lineWidth = 2; ctxStudio.setLineDash([6, 6]);
                ctxStudio.strokeRect(x - 6, el.y - h + 2, w + 12, h + 10);
                ctxStudio.setLineDash([]);
            }
        });
    }
}

function updatePropsPanel() {
    const panel = document.getElementById('props-panel');
    if(!selectedElementId) { panel.classList.add('hidden'); return; }
    
    panel.classList.remove('hidden');
    const el = gfxState.elements.find(e => e.id === selectedElementId);
    
    document.getElementById('props-title').textContent = el.fieldKey.replace('_', ' ').toUpperCase();
    document.getElementById('prop_font').value = el.font;
    document.getElementById('prop_color').value = el.color;
    document.getElementById('prop_size').value = el.size;
    document.getElementById('prop_align').value = el.align;
    
    document.getElementById('prop_bold').className = el.bold ? 'flex-1 premium-input bg-blue-100 text-blue-700 border-blue-300 rounded-xl p-2 text-xs font-bold' : 'flex-1 premium-input bg-slate-50 rounded-xl p-2 text-xs font-bold';
    document.getElementById('prop_italic').className = el.italic ? 'flex-1 premium-input bg-blue-100 text-blue-700 border-blue-300 rounded-xl p-2 text-xs italic' : 'flex-1 premium-input bg-slate-50 rounded-xl p-2 text-xs italic';

    const tw = document.getElementById('props-custom-text-wrapper');
    if (el.fieldKey === 'custom') { tw.classList.remove('hidden'); document.getElementById('prop_text').value = el.text; }
    else { tw.classList.add('hidden'); }
}

['prop_font', 'prop_color', 'prop_size', 'prop_align'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', (e) => {
        if(!selectedElementId) return; let el = gfxState.elements.find(x => x.id === selectedElementId);
        if(id==='prop_font') { el.font = e.target.value; document.fonts.load(`${el.size}px ${el.font}`).then(renderStudioCanvas); }
        if(id==='prop_color') el.color = e.target.value;
        if(id==='prop_size') el.size = Number(e.target.value);
        if(id==='prop_align') el.align = e.target.value;
        renderStudioCanvas();
    });
});

document.getElementById('prop_text')?.addEventListener('input', (e) => {
    if(!selectedElementId) return; let el = gfxState.elements.find(x => x.id === selectedElementId);
    if(el.fieldKey === 'custom') { el.text = e.target.value; renderStudioCanvas(); }
});
document.getElementById('prop_bold')?.addEventListener('click', () => {
    if(!selectedElementId) return; let el = gfxState.elements.find(x => x.id === selectedElementId);
    el.bold = !el.bold; updatePropsPanel(); renderStudioCanvas();
});
document.getElementById('prop_italic')?.addEventListener('click', () => {
    if(!selectedElementId) return; let el = gfxState.elements.find(x => x.id === selectedElementId);
    el.italic = !el.italic; updatePropsPanel(); renderStudioCanvas();
});
document.getElementById('btn-del-element')?.addEventListener('click', () => {
    gfxState.elements = gfxState.elements.filter(x => x.id !== selectedElementId);
    selectedElementId = null; updatePropsPanel(); renderStudioCanvas();
});

document.getElementById('btn-save-graphics')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-save-graphics');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Saving...';
    btn.disabled = true;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // Only upload to Supabase if it's a new local file (data URL)
    const file = document.getElementById('gfx_bg_file')?.files[0];
    if (file && gfxState.bg_url && gfxState.bg_url.startsWith('data:')) {
        const { data, error } = await supabase.storage.from('campaign-assets').upload(`${currentGfxModeStudio}_bg_${Date.now()}.png`, file);
        if(!error) gfxState.bg_url = supabase.storage.from('campaign-assets').getPublicUrl(data.path).data.publicUrl;
    }

    const fontFile = document.getElementById('gfx_font_file')?.files[0];
    if (fontFile) {
        const fontName = fontFile.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');
        const { data, error } = await supabase.storage.from('campaign-assets').upload(`font_${fontName}_${Date.now()}.ttf`, fontFile);
        if(!error) {
            const fontUrl = supabase.storage.from('campaign-assets').getPublicUrl(data.path).data.publicUrl;
            let currentFonts = siteContent.custom_fonts || [];
            currentFonts.push({ name: fontName, url: fontUrl });
            await supabase.from('site_content').update({ custom_fonts: currentFonts }).eq('id', 1);
            siteContent.custom_fonts = currentFonts;
            injectCustomFonts();
        }
    }

    const payload = currentGfxModeStudio === 'poster' ? { poster_config: gfxState, poster_bg_url: gfxState.bg_url } : { receipt_config: gfxState, receipt_bg_url: gfxState.bg_url };
    await supabase.from('site_content').update(payload).eq('id', 1);

    Toastify({ text: "Studio Saved", style: { background: "#10b981" } }).showToast();
    btn.innerHTML = originalText;
    btn.disabled = false;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    loadData();
});

document.getElementById('btn-reset-gfx')?.addEventListener('click', () => {
    if(!confirm("Clear all elements?")) return;
    gfxState.elements = []; selectedElementId = null;
    updatePropsPanel(); renderStudioCanvas();
});

// Init
setupAdminLocations();