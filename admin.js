import { supabase } from './supabase-client.js';

if (typeof lucide !== 'undefined') lucide.createIcons();

let currentDonations = [];
let siteContent = null;
let currentGfxMode = 'poster';

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


// --- TAB ROUTING ---
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
        if(tab.content) tab.content.classList.toggle('hidden', key !== activeKey);
        
        if(tab.btn) {
            tab.btn.className = key === activeKey 
                ? 'w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800 text-white font-medium shadow-sm transition-all'
                : 'w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 font-medium text-slate-400 transition-colors';
            
            const icon = tab.btn.querySelector('i');
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

document.getElementById('nav-overview')?.addEventListener('click', () => switchTab('overview'));
document.getElementById('nav-verify')?.addEventListener('click', () => switchTab('verify'));
document.getElementById('nav-offline')?.addEventListener('click', () => switchTab('offline'));
document.getElementById('nav-cms')?.addEventListener('click', () => switchTab('cms'));
document.getElementById('nav-poster')?.addEventListener('click', () => switchTab('poster'));


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
    populateGraphicsForm();
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


// --- ADVANCED TABLE FILTERING & RENDERING ---
function renderTable() {
    const tbody = document.getElementById('donations-tbody');
    if(!tbody) return;

    const search = (document.getElementById('f_search')?.value || '').toLowerCase();
    const state = document.getElementById('f_state')?.value || 'all';
    const dist = document.getElementById('f_district')?.value || 'all';
    const status = document.getElementById('f_status')?.value || 'all';
    const msg = document.getElementById('f_msg')?.value || 'all';
    const dFrom = document.getElementById('f_date_from')?.value;
    const dTo = document.getElementById('f_date_to')?.value;

    const filtered = currentDonations.filter(d => {
        if (search && !d.donor_name.toLowerCase().includes(search) && !(d.phone_number||'').includes(search) && !(d.transaction_ref||'').toLowerCase().includes(search)) return false;
        if (state !== 'all' && d.state !== state) return false;
        if (dist !== 'all' && d.district !== dist) return false;
        if (status === 'verified' && !d.is_verified) return false;
        if (status === 'pending' && d.is_verified) return false;
        if (msg === 'sent' && !d.msg_sent) return false;
        if (msg === 'unsent' && d.msg_sent) return false;
        
        const dDate = new Date(d.created_at);
        if (dFrom && dDate < new Date(dFrom)) return false;
        if (dTo && dDate > new Date(dTo + 'T23:59:59')) return false;
        return true;
    });

    tbody.innerHTML = filtered.map(d => {
        const dDate = new Date(d.created_at);
        const formatPhone = d.phone_number ? `<p class="text-xs text-slate-500 font-mono"><i data-lucide="phone" class="w-3 h-3 inline"></i> ${d.phone_number}</p>` : '';
        const utrString = d.transaction_ref && d.transaction_ref !== 'null' ? d.transaction_ref : '';
        
        return `
        <tr class="hover:bg-slate-50/80 transition-colors group border-b border-slate-100">
            <td class="p-4">
                <p class="font-extrabold text-slate-900 text-sm">${d.donor_name}</p>
                ${formatPhone}
                <p class="text-[10px] text-slate-400 mt-1">${dDate.toLocaleDateString()} at ${dDate.toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}</p>
            </td>
            <td class="p-4">
                <p class="text-sm font-bold text-slate-700">${d.place || '-'}</p>
                <p class="text-xs text-slate-500">${d.district ? d.district+', ' : ''}${d.state || '-'}</p>
            </td>
            <td class="p-4">
                <p class="font-black text-emerald-600 text-base">₹${d.amount}</p>
                <p class="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${d.is_offline ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}">
                    ${d.is_offline ? 'OFFLINE' : 'UTR: ' + (utrString || 'Not Set')}
                </p>
            </td>
            <td class="p-4 text-center">
                ${d.is_verified ? `
                    <button onclick="processWhatsAppReceipt('${d.id}')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 mx-auto ${d.msg_sent ? 'bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/20' : 'bg-slate-900 text-white hover:bg-slate-800'}">
                        <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> ${d.msg_sent ? 'Resend WA' : 'Send Receipt'}
                    </button>
                    ${d.receipt_number ? `<p class="text-[9px] text-slate-400 font-mono mt-1">Rec: #${d.receipt_number}</p>` : ''}
                ` : '<span class="text-xs text-slate-400 italic">Verify first</span>'}
            </td>
            <td class="p-4 text-right">
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

// --- VERIFY MODAL & UTR LOGIC ---
window.openVerifyModal = (id, currentUtr) => {
    document.getElementById('verify_id').value = id;
    document.getElementById('verify_utr').value = currentUtr || '';
    document.getElementById('verify-utr-modal').classList.remove('hidden');
};

window.submitVerification = async () => {
    const id = document.getElementById('verify_id').value;
    const utr = document.getElementById('verify_utr').value.trim();
    const btn = document.getElementById('btn-confirm-verify');
    
    // Check for Duplicates
    if (utr) {
        const duplicate = currentDonations.find(d => d.transaction_ref === utr && d.id !== id);
        if (duplicate) {
            if(!confirm(`Warning! UTR ${utr} is already associated with a donation by ${duplicate.donor_name}. Do you want to proceed anyway?`)) {
                return;
            }
        }
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin inline-block"></i> Saving...';
    btn.disabled = true;
    if(typeof lucide !== 'undefined') lucide.createIcons();

    // Check if we are verifying for the first time, or just editing an existing UTR
    const existingDonation = currentDonations.find(d => d.id === id);
    const updateData = { transaction_ref: utr || null };
    
    if (!existingDonation.is_verified) {
        updateData.is_verified = true;
        updateData.verified_at = new Date();
        updateData.is_published_by_admin = true;
    }

    await supabase.from('donations').update(updateData).eq('id', id);
    
    Toastify({ 
        text: existingDonation.is_verified ? "UTR Updated Successfully" : "Donation Verified Successfully", 
        style: { background: "#10b981" } 
    }).showToast();
    
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
    const conf = siteContent.receipt_config || {};
    
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0, canvas.width, canvas.height);
    const drawContent = async () => {
        ctx.textAlign = "center";
        
        ctx.font = `bold ${conf.name?.size||30}px Inter`; ctx.fillStyle = conf.name?.color||'#000';
        ctx.fillText(donation.donor_name, conf.name?.x||300, conf.name?.y||200);
        
        ctx.font = `bold ${conf.amount?.size||25}px Inter`; ctx.fillStyle = conf.amount?.color||'#10b981';
        ctx.fillText(`₹${donation.amount}`, conf.amount?.x||300, conf.amount?.y||250);
        
        const dStr = new Date(donation.created_at).toLocaleDateString();
        ctx.font = `bold ${conf.date?.size||20}px Inter`; ctx.fillStyle = conf.date?.color||'#64748b';
        ctx.fillText(dStr, conf.date?.x||300, conf.date?.y||300);
        
        ctx.font = `bold ${conf.receipt_no?.size||20}px Inter`; ctx.fillStyle = conf.receipt_no?.color||'#64748b';
        ctx.fillText(`No: ${recNo}`, conf.receipt_no?.x||300, conf.receipt_no?.y||350);

        canvas.toBlob(async (blob) => {
            const fileName = `rec_${id}_${Date.now()}.jpg`;
            const { data, error } = await supabase.storage.from('receipts').upload(fileName, blob);
            if(error) return Toastify({ text: "Upload failed", style: {background: "#ef4444"} }).showToast();
            
            const recUrl = supabase.storage.from('receipts').getPublicUrl(fileName).data.publicUrl;
            
            await supabase.from('donations').update({ msg_sent: true }).eq('id', id);
            
            let template = siteContent.wa_template || "Thank you {name} for ₹{amount}. Receipt: {receipt_url}";
            template = template.replace('{name}', donation.donor_name).replace('{amount}', donation.amount).replace('{receipt_url}', recUrl);
            
            let waNum = donation.phone_number.replace(/\D/g,'');
            if(waNum.length === 10) waNum = '91' + waNum;
            window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(template)}`, '_blank');
            
            loadData(); 
        }, 'image/jpeg', 0.8);
    };

    if(siteContent.receipt_bg_url) {
        const img = new Image(); img.crossOrigin = "Anonymous"; img.src = siteContent.receipt_bg_url;
        img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); drawContent(); };
    } else {
        drawContent(); 
    }
};

// --- PDF & CSV EXPORTS ---
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
    
    doc.setFontSize(18);
    doc.text("SSF Trust - Donation Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    const tableData = currentDonations.map(d => [
        new Date(d.created_at).toLocaleDateString(),
        d.receipt_number || '-',
        d.donor_name,
        d.phone_number || '-',
        `Rs. ${d.amount}`,
        d.is_verified ? 'Verified' : 'Pending'
    ]);

    doc.autoTable({
        startY: 36,
        head: [['Date', 'Receipt No', 'Donor Name', 'Phone', 'Amount', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9 }
    });

    doc.save(`SSF_Donation_Report_${Date.now()}.pdf`);
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

// --- GRAPHICS BUILDER (Dual Engine) ---
function populateGraphicsForm() {
    if(!siteContent) return;
    const conf = currentGfxMode === 'poster' ? (siteContent.poster_config||{}) : (siteContent.receipt_config||{});
    
    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
    setVal('g_name_x', conf.name?.x||300); setVal('g_name_y', conf.name?.y||400); setVal('g_name_c', conf.name?.color||'#000000');
    setVal('g_amt_x', conf.amount?.x||300); setVal('g_amt_y', conf.amount?.y||450); setVal('g_amt_c', conf.amount?.color||'#10b981');
    
    if(currentGfxMode === 'poster') {
        setVal('g_state_x', conf.state?.x||300); setVal('g_state_y', conf.state?.y||500); setVal('g_state_c', conf.state?.color||'#cbd5e1');
    } else {
        setVal('g_date_x', conf.date?.x||300); setVal('g_date_y', conf.date?.y||500); setVal('g_date_c', conf.date?.color||'#64748b');
        setVal('g_rec_x', conf.receipt_no?.x||300); setVal('g_rec_y', conf.receipt_no?.y||550); setVal('g_rec_c', conf.receipt_no?.color||'#64748b');
    }
    window.previewGraphics();
}

document.getElementById('mode-poster')?.addEventListener('click', (e) => {
    currentGfxMode = 'poster';
    e.target.className = 'flex-1 py-2.5 rounded-lg bg-white shadow-sm text-emerald-700 font-bold transition-all';
    document.getElementById('mode-receipt').className = 'flex-1 py-2.5 rounded-lg text-slate-500 hover:text-slate-700 transition-all font-medium';
    document.getElementById('gfx_opt_state').classList.remove('hidden');
    document.getElementById('gfx_opt_receipt').classList.add('hidden');
    populateGraphicsForm();
});

document.getElementById('mode-receipt')?.addEventListener('click', (e) => {
    currentGfxMode = 'receipt';
    e.target.className = 'flex-1 py-2.5 rounded-lg bg-white shadow-sm text-emerald-700 font-bold transition-all';
    document.getElementById('mode-poster').className = 'flex-1 py-2.5 rounded-lg text-slate-500 hover:text-slate-700 transition-all font-medium';
    document.getElementById('gfx_opt_state').classList.add('hidden');
    document.getElementById('gfx_opt_receipt').classList.remove('hidden');
    populateGraphicsForm();
});

window.previewGraphics = () => {
    const canvas = document.getElementById('admin-preview-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0,0, canvas.width, canvas.height); 
    
    const drawElements = () => {
        ctx.textAlign = "center";
        
        ctx.font = `bold 30px Inter`; ctx.fillStyle = document.getElementById('g_name_c')?.value||'#000';
        ctx.fillText("JANE DOE", document.getElementById('g_name_x')?.value||300, document.getElementById('g_name_y')?.value||400);
        
        ctx.font = `bold 25px Inter`; ctx.fillStyle = document.getElementById('g_amt_c')?.value||'#10b981';
        ctx.fillText("₹1000", document.getElementById('g_amt_x')?.value||300, document.getElementById('g_amt_y')?.value||450);
        
        if(currentGfxMode === 'poster') {
            ctx.font = `bold 20px Inter`; ctx.fillStyle = document.getElementById('g_state_c')?.value||'#cbd5e1';
            ctx.fillText("KERALA", document.getElementById('g_state_x')?.value||300, document.getElementById('g_state_y')?.value||500);
        } else {
            ctx.font = `bold 20px Inter`; ctx.fillStyle = document.getElementById('g_date_c')?.value||'#64748b';
            ctx.fillText("12/10/2026", document.getElementById('g_date_x')?.value||300, document.getElementById('g_date_y')?.value||500);
            
            ctx.font = `bold 20px Inter`; ctx.fillStyle = document.getElementById('g_rec_c')?.value||'#64748b';
            ctx.fillText("No: 1042", document.getElementById('g_rec_x')?.value||300, document.getElementById('g_rec_y')?.value||550);
        }
    };

    const bgUrl = currentGfxMode === 'poster' ? siteContent?.poster_bg_url : siteContent?.receipt_bg_url;
    if(bgUrl) {
        const img = new Image(); img.crossOrigin = "Anonymous"; img.src = bgUrl;
        img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); drawElements(); };
    } else {
        drawElements();
    }
};

document.getElementById('graphics-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-graphics');
    if(btn) { btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin inline"></i> Saving...'; btn.disabled = true; }
    
    let bg_url = currentGfxMode === 'poster' ? siteContent.poster_bg_url : siteContent.receipt_bg_url;
    const fileInput = document.getElementById('gfx_bg_file');
    
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const { data, error } = await supabase.storage.from('campaign-assets').upload(`${currentGfxMode}_bg_${Date.now()}.png`, file);
        if(!error) bg_url = supabase.storage.from('campaign-assets').getPublicUrl(data.path).data.publicUrl;
    }

    const config = {
        name: { x: document.getElementById('g_name_x')?.value, y: document.getElementById('g_name_y')?.value, size: 30, color: document.getElementById('g_name_c')?.value },
        amount: { x: document.getElementById('g_amt_x')?.value, y: document.getElementById('g_amt_y')?.value, size: 25, color: document.getElementById('g_amt_c')?.value }
    };
    
    if(currentGfxMode === 'poster') {
        config.state = { x: document.getElementById('g_state_x')?.value, y: document.getElementById('g_state_y')?.value, size: 20, color: document.getElementById('g_state_c')?.value };
    } else {
        config.date = { x: document.getElementById('g_date_x')?.value, y: document.getElementById('g_date_y')?.value, size: 20, color: document.getElementById('g_date_c')?.value };
        config.receipt_no = { x: document.getElementById('g_rec_x')?.value, y: document.getElementById('g_rec_y')?.value, size: 20, color: document.getElementById('g_rec_c')?.value };
    }

    const updatePayload = currentGfxMode === 'poster' 
        ? { poster_bg_url: bg_url, poster_config: config }
        : { receipt_bg_url: bg_url, receipt_config: config };

    await supabase.from('site_content').update(updatePayload).eq('id', 1);

    Toastify({ text: "Graphics Config Saved", style: { background: "#10b981" } }).showToast();
    if(btn) { btn.innerHTML = 'Save Config'; btn.disabled = false; }
    loadData();
});

// Init Dropdowns
setupAdminLocations();