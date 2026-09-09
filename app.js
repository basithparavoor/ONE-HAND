import { supabase } from './supabase-client.js';

// Initialize Icons safely
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

const formatMoney = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

// --- GLOBAL STATE ---
let campaignData = null;
let currentDonationState = {}; 
let currentDonors = [];
let endInterval;

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

function populateLocations() {
    const dState = document.getElementById('donor_state');
    const dDist = document.getElementById('donor_district');
    const fState = document.getElementById('filter-state');
    const fDist = document.getElementById('filter-district');
    
    if (!dState || !fState) return;

    Object.keys(indiaData).sort().forEach(state => {
        dState.innerHTML += `<option value="${state}">${state}</option>`;
        fState.innerHTML += `<option value="${state}">${state}</option>`;
    });

    dState.addEventListener('change', (e) => updateDistricts(e.target.value, dDist));
    fState.addEventListener('change', (e) => { 
        updateDistricts(e.target.value, fDist); 
        filterWall(); 
    });
    fDist?.addEventListener('change', filterWall);
}

function updateDistricts(state, targetSelect) {
    if (!targetSelect) return;
    targetSelect.innerHTML = '<option value="all">All Districts</option>';
    if (state && indiaData[state]) {
        targetSelect.disabled = false;
        targetSelect.classList.remove('bg-slate-50', 'opacity-50');
        indiaData[state].sort().forEach(d => targetSelect.innerHTML += `<option value="${d}">${d}</option>`);
    } else {
        targetSelect.disabled = true;
        targetSelect.classList.add('bg-slate-50', 'opacity-50');
    }
}

// --- CORE DATA FETCHING ---
async function loadCampaignStats() {
    const { data, error } = await supabase.from('public_campaign_stats').select('*').single();
    if (error || !data) return console.error('Failed to load stats:', error);
    campaignData = data;

    // FIX: Pull directly from site_content to get the newly added donor_share_template 
    // (since it's not exposed in the old public_campaign_stats SQL view yet)
    const { data: siteData } = await supabase.from('site_content').select('donor_share_template').single();
    if (siteData && siteData.donor_share_template) {
        campaignData.donor_share_template = siteData.donor_share_template;
    }

    // Load Admin Custom Fonts for Public View
    if (campaignData.custom_fonts && campaignData.custom_fonts.length > 0) {
        let css = campaignData.custom_fonts.map(f => `@font-face { font-family: '${f.name}'; src: url('${f.url}'); }`).join('\n');
        document.getElementById('custom-fonts-style').innerHTML = css;
        
        // Force the fonts to load into the browser's cache so the canvas can immediately use them
        campaignData.custom_fonts.forEach(f => {
            const fontFace = new FontFace(f.name, `url(${f.url})`);
            fontFace.load().then((loadedFace) => { document.fonts.add(loadedFace); });
        });
    }

    const titleEl = document.getElementById('campaign-title');
    if(titleEl) titleEl.textContent = data.campaign_title;
    const descEl = document.getElementById('campaign-desc');
    if(descEl) descEl.textContent = data.campaign_description;
    
    const headerEl = document.getElementById('site-header-text');
    if(headerEl) headerEl.textContent = data.header_text || data.campaign_title;
    const msgEl = document.getElementById('thank-you-msg');
    if(msgEl) msgEl.textContent = data.thank_you_message || 'Thank you for your generous contribution!';
    
    if(data.logo_url) {
        const logo = document.getElementById('site-logo');
        if(logo) { logo.src = data.logo_url; logo.classList.remove('hidden'); }
    }

    const bannerContainer = document.getElementById('campaign-banner');
    if(bannerContainer && data.banner_url) {
        bannerContainer.style.backgroundImage = `url('${data.banner_url}')`;
    } else if (bannerContainer) {
        bannerContainer.style.backgroundImage = `linear-gradient(135deg, #0f172a 0%, #064e3b 100%)`;
    }

    const cost = Number(data.unit_cost);
    const opts = document.getElementById('amount-options');
    if(opts) {
        opts.innerHTML = `
            <label class="block cursor-pointer bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 text-center transition hover:bg-emerald-100 shadow-sm relative">
                <input type="radio" name="amt_preset" value="${cost}" class="hidden" checked onchange="toggleCustomAmt(false)">
                <span class="block font-black text-emerald-700 text-lg md:text-xl">1 Student</span>
                <span class="block text-sm font-bold text-emerald-600 mt-1">₹${cost}</span>
                <div class="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">DEFAULT</div>
            </label>
            <label class="block cursor-pointer bg-white border-2 border-slate-200 rounded-xl p-4 text-center transition hover:border-emerald-300">
                <input type="radio" name="amt_preset" value="${cost * 2}" class="hidden" onchange="toggleCustomAmt(false)">
                <span class="block font-black text-slate-700 text-lg md:text-xl">2 Students</span>
                <span class="block text-sm font-bold text-slate-500 mt-1">₹${cost * 2}</span>
            </label>
            <label class="block cursor-pointer bg-white border-2 border-slate-200 rounded-xl p-4 text-center transition hover:border-emerald-300">
                <input type="radio" name="amt_preset" value="${cost * 5}" class="hidden" onchange="toggleCustomAmt(false)">
                <span class="block font-black text-slate-700 text-lg md:text-xl">5 Students</span>
                <span class="block text-sm font-bold text-slate-500 mt-1">₹${cost * 5}</span>
            </label>
            <label class="block cursor-pointer bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-center transition hover:border-slate-300 flex flex-col justify-center items-center">
                <input type="radio" name="amt_preset" value="custom" class="hidden" onchange="toggleCustomAmt(true)">
                <span class="block font-black text-slate-700 text-lg md:text-xl">Custom ₹</span>
            </label>
        `;

        document.querySelectorAll('input[name="amt_preset"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.querySelectorAll('input[name="amt_preset"]').forEach(r => {
                    const label = r.closest('label');
                    if(r.checked) {
                        label.classList.replace('bg-white', 'bg-emerald-50');
                        label.classList.replace('bg-slate-50', 'bg-emerald-50');
                        label.classList.replace('border-slate-200', 'border-emerald-500');
                        label.querySelector('span').classList.replace('text-slate-700', 'text-emerald-700');
                    } else {
                        label.classList.replace('bg-emerald-50', r.value==='custom'?'bg-slate-50':'bg-white');
                        label.classList.replace('border-emerald-500', 'border-slate-200');
                        label.querySelector('span').classList.replace('text-emerald-700', 'text-slate-700');
                    }
                });
            });
        });
    }

   updateDOMStats(Number(data.total_collected), 'all', 'all');
    if(data.end_date) startTimer(data.end_date);
}

function updateDOMStats(collectedAmount, stateName, districtName) {
    if (!campaignData) return;
    const cost = Number(campaignData.unit_cost) || 1;
    const targetStudents = Number(campaignData.target_units) || 1;
    const studentsSponsored = Math.floor(collectedAmount / cost);

    if(document.getElementById('students-sponsored')) document.getElementById('students-sponsored').textContent = studentsSponsored;
    if(document.getElementById('students-target')) document.getElementById('students-target').textContent = `/ ${targetStudents}`;
    
    const mainEl = document.getElementById('total-collected-main');
    if(mainEl) {
        mainEl.textContent = formatMoney(collectedAmount);
        
        // Dynamically change the label text above the amount
        const labelEl = mainEl.previousElementSibling;
        if(labelEl) {
            if (districtName && districtName !== 'all') {
                labelEl.textContent = `Raised in ${districtName}`;
            } else if (stateName && stateName !== 'all') {
                labelEl.textContent = `Raised in ${stateName}`;
            } else {
                labelEl.textContent = 'Total Raised';
            }
        }
    }

    // Animate the progress bar based on the filtered amount
    let percentage = (studentsSponsored / targetStudents) * 100;
    const progBar = document.getElementById('progress-bar');
    if(progBar) {
        setTimeout(() => {
            progBar.style.width = `${Math.min(percentage, 100)}%`; 
        }, 50);
    }
}

async function fetchFilteredStats(state, district) {
    if (!campaignData) return;
    
    // Revert to global overall stats if no filter is applied
    if (state === 'all') {
        updateDOMStats(Number(campaignData.total_collected || 0), 'all', 'all');
        return;
    }

    // Fetch precise sum for selected state/district
    let query = supabase.from('donations').select('amount').eq('is_verified', true).eq('state', state);
    if (district !== 'all' && district !== '') {
        query = query.eq('district', district);
    }

    const { data, error } = await query;
    if (!error && data) {
        const filteredTotal = data.reduce((sum, row) => sum + Number(row.amount), 0);
        updateDOMStats(filteredTotal, state, district);
    }
}

function startTimer(endDateString) {
    const endDate = new Date(endDateString).getTime();
    document.getElementById('countdown-container')?.classList.remove('hidden');
    
    endInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = endDate - now;
        
        if (distance < 0) {
            clearInterval(endInterval);
            if(document.getElementById('countdown-container')) {
                document.getElementById('countdown-container').innerHTML = '<p class="text-red-500 font-bold w-full">Campaign Ended</p>';
            }
            return;
        }
        
        if(document.getElementById('timer-days')) document.getElementById('timer-days').innerText = Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
        if(document.getElementById('timer-hours')) document.getElementById('timer-hours').innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
        if(document.getElementById('timer-mins')) document.getElementById('timer-mins').innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    }, 1000);
}

window.toggleCustomAmt = (show) => {
    const input = document.getElementById('custom_amount');
    if(!input) return;
    if(show) { input.classList.remove('hidden'); input.required = true; input.focus(); } 
    else { input.classList.add('hidden'); input.required = false; }
};

// --- WALL LOGIC & FILTERING ---
async function loadDonors(type = 'recent') {
    const viewName = type === 'recent' ? 'public_donor_wall' : 'public_top_donors';
    const { data } = await supabase.from(viewName).select('*').limit(20);
    currentDonors = data || [];
    filterWall();
}

function filterWall() {
    const stateFilter = document.getElementById('filter-state')?.value || 'all';
    const distFilter = document.getElementById('filter-district')?.value || 'all';
    const wall = document.getElementById('donor-wall');
    
    // ADD THIS NEW LINE HERE:
    fetchFilteredStats(stateFilter, distFilter);

    if(!wall) return;
    
    const filtered = currentDonors.filter(d => {
        if(stateFilter !== 'all' && d.state !== stateFilter) return false;
        if(distFilter !== 'all' && distFilter !== '' && d.district !== distFilter) return false;
        return true;
    });

    if (filtered.length === 0) {
        wall.innerHTML = '<div class="glass-card p-6 rounded-2xl text-center"><p class="text-sm text-slate-500">No public donations found matching this filter.</p></div>';
        return;
    }

    wall.innerHTML = filtered.map((d, index) => `
        <div class="glass-card p-5 rounded-2xl animate-fade-in-up border border-white/60 shadow-sm" style="animation-delay: ${index * 30}ms">
            <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-bold text-xl shadow-inner">
                        ${d.donor_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p class="font-bold text-slate-900 flex items-center gap-1.5 text-base">
                            ${d.donor_name}
                            <i data-lucide="badge-check" class="w-4 h-4 text-blue-500 fill-blue-50"></i>
                        </p>
                        <p class="text-xs text-slate-500 font-medium">${d.district ? d.district+', ' : ''}${d.state}</p>
                    </div>
                </div>
                <span class="font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 text-lg">${formatMoney(d.amount)}</span>
            </div>
            ${d.donor_message ? `<div class="mt-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex items-start gap-2"><i data-lucide="quote" class="w-4 h-4 text-slate-300 shrink-0 mt-0.5"></i><p class="text-sm text-slate-600 italic">"${d.donor_message}"</p></div>` : ''}
        </div>
    `).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// --- EVENT LISTENERS ---
const tabRecent = document.getElementById('tab-recent');
const tabTop = document.getElementById('tab-top');

tabRecent?.addEventListener('click', () => {
    tabRecent.className = 'text-lg font-bold text-emerald-700 transition-colors flex items-center gap-2';
    if(tabTop) tabTop.className = 'text-lg font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2';
    loadDonors('recent');
});

tabTop?.addEventListener('click', () => {
    tabTop.className = 'text-lg font-bold text-emerald-700 transition-colors flex items-center gap-2';
    if(tabRecent) tabRecent.className = 'text-lg font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2';
    loadDonors('top');
});

window.switchTab = (tab) => {
    document.getElementById('view-campaign')?.classList.toggle('hidden', tab !== 'campaign');
    document.getElementById('view-mytxns')?.classList.toggle('hidden', tab !== 'my-txns');
    
    document.getElementById('nav-campaign')?.classList.toggle('border-b-2', tab === 'campaign');
    document.getElementById('nav-campaign')?.classList.toggle('text-emerald-700', tab === 'campaign');
    document.getElementById('nav-mytxns')?.classList.toggle('border-b-2', tab === 'my-txns');
    document.getElementById('nav-mytxns')?.classList.toggle('text-emerald-700', tab === 'my-txns');

    if (tab === 'my-txns') {
        loadMyTransactions();
    }
};

// --- AUTO-LOAD MY TRANSACTIONS USING LOCAL STORAGE ---
async function loadMyTransactions() {
    const resDiv = document.getElementById('my-txns-results');
    if(!resDiv) return;

    let storedIds = JSON.parse(localStorage.getItem('ssf_my_txns') || '[]');
    
    if (storedIds.length === 0) {
        resDiv.innerHTML = '<p class="text-slate-500 text-center font-medium bg-white p-6 rounded-2xl border border-slate-200">No transactions found on this device yet.</p>';
        return;
    }

    resDiv.innerHTML = '<p class="text-slate-500 text-center"><i data-lucide="loader-2" class="animate-spin inline w-5 h-5 mr-2"></i> Fetching your records...</p>';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const { data } = await supabase.from('donations')
        .select('*')
        .in('id', storedIds)
        .order('created_at', {ascending: false});
    
    if(!data || data.length === 0) {
        resDiv.innerHTML = '<p class="text-slate-500 text-center bg-white p-6 rounded-2xl border border-slate-200">No active transactions found on this device.</p>';
        localStorage.setItem('ssf_my_txns', '[]');
        return;
    }

    const validIds = data.map(d => d.id);
    localStorage.setItem('ssf_my_txns', JSON.stringify(validIds));

    resDiv.innerHTML = data.map(d => {
        // Safely escape parameters
        const safeName = (d.donor_name || '').replace(/'/g, "\\'");
        const safeState = (d.state || '').replace(/'/g, "\\'");
        const safeDist = (d.district || '').replace(/'/g, "\\'");
        const safePlace = (d.place || '').replace(/'/g, "\\'");
        
        return `
        <div class="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm hover:border-emerald-300 transition-colors">
            <div>
                <p class="font-bold text-slate-900 text-lg">₹${d.amount}</p>
                <p class="text-xs text-slate-500">${new Date(d.created_at).toLocaleDateString()} - ${d.is_verified ? '<span class="text-emerald-600 font-bold px-1.5 py-0.5 bg-emerald-50 rounded">Verified</span>' : '<span class="text-amber-600 font-bold px-1.5 py-0.5 bg-amber-50 rounded">Pending Approval</span>'}</p>
            </div>
            <button onclick="reprintPoster('${safeName}', ${d.amount}, '${safeState}', '${safeDist}', '${safePlace}')" class="text-sm bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl font-bold text-white transition flex items-center gap-2"><i data-lucide="image" class="w-4 h-4"></i> View Poster</button>
        </div>
    `}).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// --- FORM SUBMIT (Show Payment Modal) ---
document.getElementById('donation-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const presetNode = document.querySelector('input[name="amt_preset"]:checked');
    if(!presetNode) return;
    const preset = presetNode.value;
    const finalAmount = preset === 'custom' ? document.getElementById('custom_amount').value : preset;
    
    currentDonationState = {
        name: document.getElementById('donor_name').value,
        phone: document.getElementById('phone_number').value,
        state: document.getElementById('donor_state').value,
        district: document.getElementById('donor_district').value,
        place: document.getElementById('donor_place').value,
        message: document.getElementById('donor_message').value,
        wants_public: document.getElementById('donor_wants_public').checked,
        amount: finalAmount
    };

    const upiId = campaignData.upi_id;
    const payeeName = campaignData.campaign_title.replace(/\s/g, '%20');
    const upiLink = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${finalAmount}&cu=INR`;
    
    document.getElementById('pay-amount-display').textContent = formatMoney(finalAmount);
    document.getElementById('dynamic-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
    document.getElementById('btn-gpay').href = `gpay://upi/pay?pa=${upiId}&pn=${payeeName}&am=${finalAmount}&cu=INR`;
    document.getElementById('btn-phonepe').href = `phonepe://pay?pa=${upiId}&pn=${payeeName}&am=${finalAmount}&cu=INR`;

    document.getElementById('payment-modal')?.classList.remove('hidden');
});

// --- I HAVE PAID (WITH NATIVE WEB SHARE API) ---
document.getElementById('btn-paid')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-paid');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin inline w-5 h-5 mr-2"></i> Registering...';
    btn.disabled = true;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const { data: insertData, error: insertErr } = await supabase.from('donations').insert([{
            donor_name: currentDonationState.name,
            phone_number: currentDonationState.phone,
            state: currentDonationState.state,
            district: currentDonationState.district,
            place: currentDonationState.place,
            amount: currentDonationState.amount,
            transaction_ref: null,
            donor_message: currentDonationState.message,
            donor_wants_public: currentDonationState.wants_public,
            screenshot_url: null,
            is_offline: false,
            is_verified: false,
            is_published_by_admin: false
        }]).select();

        if (insertErr) throw insertErr;

        if (insertData && insertData.length > 0) {
            let myTxns = JSON.parse(localStorage.getItem('ssf_my_txns') || '[]');
            myTxns.push(insertData[0].id);
            localStorage.setItem('ssf_my_txns', JSON.stringify(myTxns));
        }

        document.getElementById('payment-modal')?.classList.add('hidden');
        document.getElementById('success-modal')?.classList.remove('hidden');
        
        generatePoster(
            currentDonationState.name, 
            currentDonationState.amount, 
            currentDonationState.state, 
            currentDonationState.district, 
            currentDonationState.place
        );
        
        // --- NATIVE WEB SHARE API ENGINE ---
        const waBtn = document.getElementById('wa-share-btn');
        if (waBtn) {
            waBtn.onclick = async (e) => {
                e.preventDefault();
                const canvas = document.getElementById('poster-canvas');
                
                // Parse the CMS Share text
                let shareTemplate = campaignData.donor_share_template || "I just sponsored a student via SSF Trust with ₹{amount}! Join the mission: {url}";
                const cleanUrl = window.location.origin + window.location.pathname; 
                const shareMsg = shareTemplate
                                    .replaceAll('{name}', currentDonationState.name)
                                    .replaceAll('{amount}', currentDonationState.amount)
                                    .replaceAll('{url}', cleanUrl);

                // Attempt to use Native OS Sharing (Android/iOS)
                if (navigator.share && canvas) {
                    try {
                        canvas.toBlob(async (blob) => {
                            const file = new File([blob], `SSF_Contribution_${currentDonationState.name.replace(/\s/g, '_')}.jpg`, { type: 'image/jpeg' });
                            
                            // Check if OS allows sharing files (Images)
                            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                await navigator.share({
                                    title: 'SSF Trust Donation',
                                    text: shareMsg,
                                    files: [file]
                                });
                            } else {
                                // Fallback: Share Text/Link only via Native OS
                                await navigator.share({ title: 'SSF Trust Donation', text: shareMsg });
                            }
                        }, 'image/jpeg', 0.9);
                        return;
                    } catch (err) {
                        console.log("Native share failed/cancelled by user.");
                    }
                } else {
                    // Ultimate Fallback: Direct WhatsApp Web Link for Desktop
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMsg)}`, '_blank');
                }
            };
        }
        
        if (typeof confetti !== 'undefined') confetti({ particleCount: 150, spread: 80, origin: {y: 0.6} });

    } catch (error) {
        console.error(error);
        Toastify({ text: "Error submitting details. Please try again.", style: { background: "#ef4444" } }).showToast();
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
});

// --- FULL LIVE GRAPHICS ENGINE INTEGRATION FOR PUBLIC POSTER ---
window.generatePoster = (name, amount, stateText, districtText, placeText) => {
    const canvas = document.getElementById('poster-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Safely pull config generated from the Admin Panel
    const config = campaignData.poster_config || { width: 600, height: 800, elements: [] };
    canvas.width = config.width || 600;
    canvas.height = config.height || 800;
    
    ctx.fillStyle = '#ffffff'; 
    ctx.fillRect(0,0, canvas.width, canvas.height);
    
    const drawContent = () => {
        if(config.elements && config.elements.length > 0) {
            config.elements.forEach(el => {
                let textToDraw = el.text;
                if(el.fieldKey === 'donor_name') textToDraw = name;
                if(el.fieldKey === 'amount') textToDraw = `₹${amount}`;
                if(el.fieldKey === 'state') textToDraw = stateText || '';
                if(el.fieldKey === 'district') textToDraw = districtText || '';
                if(el.fieldKey === 'place') textToDraw = placeText || '';
                if(el.fieldKey === 'date') textToDraw = new Date().toLocaleDateString();
                if(el.fieldKey === 'time') textToDraw = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                if(el.fieldKey === 'receipt_no') textToDraw = ''; // Not generated yet at this stage

                // Ensure the fonts loaded properly
                ctx.font = `${el.italic?'italic ':''}${el.bold?'bold ':''}${el.size || 30}px "${el.font || 'Inter'}"`;
                ctx.fillStyle = el.color || '#000000';
                ctx.textAlign = el.align || 'center';
                ctx.fillText(textToDraw, el.x, el.y);
            });
        }
        
        // Setup download button automatically
        const btn = document.getElementById('btn-download-poster');
        if(btn) {
            btn.onclick = () => {
                const link = document.createElement('a');
                link.download = `SSF_Poster_${name.replace(/\s/g, '_')}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.9);
                link.click();
            };
        }
    };

    if(campaignData.poster_bg_url) {
        const bgImg = new Image(); 
        if (!campaignData.poster_bg_url.startsWith('data:')) bgImg.crossOrigin = "Anonymous"; 
        bgImg.onload = () => { ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height); drawContent(); };
        bgImg.onerror = () => { console.error("Poster BG failed to load."); drawContent(); };
        bgImg.src = campaignData.poster_bg_url;
    } else {
        drawContent(); 
    }
};

window.reprintPoster = (name, amt, state, dist, place) => {
    document.getElementById('success-modal')?.classList.remove('hidden');
    const msg = document.getElementById('thank-you-msg');
    if(msg) msg.textContent = "Here is your generated poster!";
    
    // Pass the fully populated dynamic fields
    generatePoster(name, amt, state, dist, place);
};

// Initial calls
populateLocations();
loadCampaignStats().then(() => loadDonors('recent'));