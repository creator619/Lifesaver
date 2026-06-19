document.addEventListener('DOMContentLoaded', async () => {

    let currentUser = null;
    let dashboardData = { appointments: [], bills: [], tasks: { completed: 0, total: 0, items: [] }, shopping: [], documents: [] };

    // --- UTILS ---
    function haptic(type = 'light') {
        if (!navigator.vibrate) return;
        const p = { light:[50], medium:[80], success:[60,80,100], delete:[80,60,80] };
        navigator.vibrate(p[type] || p.light);
    }

    function recalcTasks() {
        dashboardData.tasks.total = dashboardData.tasks.items.length;
        dashboardData.tasks.completed = dashboardData.tasks.items.filter(t => t.status === 'completed').length;
    }

    function setFromLoaded(loaded) {
        dashboardData.shopping     = loaded.shopping;
        dashboardData.appointments = loaded.appointments;
        dashboardData.bills        = loaded.bills;
        dashboardData.documents    = loaded.documents;
        dashboardData.tasks.items  = loaded.tasks;
        recalcTasks();
    }

    // --- GREETING ---
    function updateGreeting() {
        const el = document.getElementById('current-date');
        if (el) { const s = new Date().toLocaleDateString('hu-HU',{weekday:'long',year:'numeric',month:'long',day:'numeric'}); el.textContent = s.charAt(0).toUpperCase()+s.slice(1); }
        const h = new Date().getHours();
        let g = h<5?'Jó éjt!':h<10?'Jó reggelt!':h<14?'Szép napot!':h<18?'Kellemes délutánt!':'Jó estét!';
        const pending = dashboardData.tasks.items.filter(t=>t.status==='pending').length;
        const unpaid  = dashboardData.bills.filter(b=>b.type!=='success').length;
        let sub = (pending===0&&unpaid===0) ? 'Minden elintézve. Pihenj egyet! 🎉' : `Ma még ${[pending>0?pending+' feladat':'',unpaid>0?unpaid+' számla':''].filter(Boolean).join(' és ')} vár rád.`;
        const ge=document.getElementById('greeting-title'), se=document.getElementById('greeting-subtitle');
        if(ge) ge.textContent=g; if(se) se.textContent=sub;
    }

    // --- RENDER DASHBOARD ---
    function renderDashboard() {
        updateGreeting();
        const c = document.getElementById('dashboard-content'); if(!c) return;
        const taskPct = dashboardData.tasks.total>0?(dashboardData.tasks.completed/dashboardData.tasks.total)*100:0;
        c.innerHTML = `
        <div class="card">
            <div class="card-header"><div class="card-title">Közelgő Időpontok</div></div>
            <div class="card-body">
            ${dashboardData.appointments.length===0?'<p style="color:var(--text-secondary);font-size:.9rem;">Nincs közelgő időpont.</p>':
            dashboardData.appointments.map(a=>`<div class="list-item"><div class="item-info"><span class="item-title">${a.title}</span><span class="item-desc">${a.time}</span></div><span class="tag tag-${a.type}">${a.time.toLowerCase().includes('ma')?'Ma':'Hamarosan'}</span></div>`).join('')}
            </div>
        </div>
        <div class="card">
            <div class="card-header"><div class="card-title">Fizetendő Számlák</div></div>
            <div class="card-body">
            ${dashboardData.bills.length===0?'<p style="color:var(--text-secondary);font-size:.9rem;">Nincs aktív számla.</p>':
            dashboardData.bills.map(b=>`<div class="list-item"><div class="item-info"><span class="item-title">${b.title}</span><span class="item-desc">${b.amount}</span></div><span class="tag tag-${b.type}">${b.due}</span></div>`).join('')}
            </div>
        </div>
        <div class="card">
            <div class="card-header"><div class="card-title">Napi Feladatok</div></div>
            <div class="card-body">
                <div class="progress-header"><span>Folyamatban</span><span>${dashboardData.tasks.completed}/${dashboardData.tasks.total} kész</span></div>
                <div class="progress-container"><div class="progress-bar" style="width:${taskPct}%"></div></div>
                <div style="margin-top:1rem;display:flex;flex-direction:column;gap:.6rem;">
                ${dashboardData.tasks.items.map(t=>`<label class="checkbox-label ${t.status==='completed'?'completed-task':''}"><input type="checkbox" onchange="window.toggleTask('${t.id}')" ${t.status==='completed'?'checked':''}><span style="flex:1">${t.title}</span></label>`).join('')}
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><div class="card-title">Új Dokumentum / Számla</div></div>
            <div class="card-body" style="display:flex;align-items:center;">
                <div class="upload-zone" id="upload-zone" style="width:100%"><input type="file" id="file-input" style="display:none" multiple>
                <div id="upload-content"><i class="fa-solid fa-cloud-arrow-up"></i><p style="font-weight:500;margin-bottom:.25rem">Húzd ide a fájlt vagy kattints</p><p style="font-size:.75rem">Automatikusan feldolgozzuk az adatokat</p></div></div>
            </div>
        </div>`;
        initUploadZone();
    }

    // --- RENDER CALENDAR ---
    function renderCalendarView() {
        const c=document.getElementById('calendar-content'); if(!c) return;
        if(!dashboardData.appointments.length){c.innerHTML=`<div class="card"><div class="card-body" style="text-align:center;color:var(--text-secondary);padding:2rem">Nincsenek közelgő időpontok.</div></div>`;return;}
        c.innerHTML=`<div class="appointment-list">${dashboardData.appointments.map(a=>`
        <div class="appointment-card">
            <div class="appointment-date"><span class="day">${a.time.toLowerCase().includes('ma')?new Date().getDate():new Date().getDate()+1}</span><span class="month">${a.time.toLowerCase().includes('ma')?'MA':'HOLN'}</span></div>
            <div class="appointment-details"><h3>${a.title}</h3><p><i class="fa-regular fa-clock"></i> ${a.time}</p></div>
            <div class="card-action" style="cursor:pointer" onclick="window.deleteAppointment('${a.id}')"><i class="fa-regular fa-trash-can" style="color:#ef4444"></i></div>
        </div>`).join('')}</div>`;
    }

    // --- RENDER BILLS ---
    function renderBillsView() {
        const c=document.getElementById('bills-content'); if(!c) return;
        let due=0,paid=0;
        dashboardData.bills.forEach(b=>{const n=parseInt(b.amount.replace(/[^0-9]/g,''))||0; b.type==='success'?paid+=n:due+=n;});
        const de=document.getElementById('total-due'),pe=document.getElementById('total-paid');
        if(de) de.textContent=new Intl.NumberFormat('hu-HU').format(due)+' Ft';
        if(pe) pe.textContent=new Intl.NumberFormat('hu-HU').format(paid)+' Ft';
        if(!dashboardData.bills.length){c.innerHTML=`<div class="card"><div class="card-body" style="text-align:center;color:var(--text-secondary);padding:2rem">Nincsenek számlák.</div></div>`;return;}
        c.innerHTML=`<div class="appointment-list">${dashboardData.bills.map(b=>{const p=b.type==='success';return`
        <div class="appointment-card" style="${p?'opacity:.6':''}">
            <div class="appointment-date" style="background:${p?'#f0fdf4':'var(--bg-main)'};border-color:${p?'#bbf7d0':'var(--border-color)'}"><i class="fa-solid fa-file-invoice-dollar" style="font-size:1.5rem;color:${p?'#16a34a':'var(--text-secondary)'}"></i></div>
            <div class="appointment-details"><h3 style="text-decoration:${p?'line-through':'none'}">${b.title}</h3><p style="color:${b.type==='alert'?'#991b1b':'var(--text-secondary)'};font-weight:500">${b.amount} &bull; ${b.due}</p></div>
            <div class="card-action">${!p?`<button class="btn-sm" style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-sm);cursor:pointer;font-weight:500" onclick="window.markBillPaid('${b.id}')"><i class="fa-solid fa-check" style="color:#16a34a"></i> Fizetve</button>`:'<span class="tag tag-success">Teljesítve</span>'}</div>
        </div>`;}).join('')}</div>`;
    }

    // --- RENDER DOCUMENTS ---
    function renderDocumentsView() {
        const c=document.getElementById('documents-content'); if(!c) return;
        if(!dashboardData.documents.length){c.innerHTML=`<div style="text-align:center;color:var(--text-secondary);padding:2rem">Nincsenek feltöltött iratok.</div>`;return;}
        c.innerHTML=dashboardData.documents.map(d=>`
        <div class="document-item">
            <div class="doc-info"><div class="doc-icon"><i class="fa-regular ${d.name.toLowerCase().endsWith('.pdf')?'fa-file-pdf':'fa-image'}"></i></div>
            <div class="doc-details"><h4>${d.name}</h4><p>${d.folder} &bull; ${d.date} &bull; ${d.size}</p></div></div>
            <div class="card-action" style="display:flex;gap:.5rem;align-items:center">
                <button class="btn-icon" style="width:32px;height:32px"><i class="fa-solid fa-download"></i></button>
                <button class="btn-danger-ghost" onclick="window.deleteDocument('${d.id}')"><i class="fa-regular fa-trash-can"></i></button>
            </div>
        </div>`).join('');
    }

    // --- RENDER TASKS ---
    function renderTasksView() {
        const c=document.getElementById('tasks-content'); if(!c) return;
        if(!dashboardData.tasks.items.length){c.innerHTML=`<div style="text-align:center;color:var(--text-secondary);padding:2rem">Nincsenek feladatok.</div>`;return;}
        const pen=[],done=[];
        dashboardData.tasks.items.forEach(t=>{
            const h=`<div class="shopping-item" style="padding:1rem 1.25rem"><label class="checkbox-label ${t.status==='completed'?'completed-task':''}" style="margin:0;cursor:pointer;width:100%"><input type="checkbox" onchange="window.toggleTask('${t.id}')" ${t.status==='completed'?'checked':''}><span style="flex:1">${t.title}</span></label><button class="btn-danger-ghost" onclick="window.deleteTask('${t.id}')"><i class="fa-regular fa-trash-can"></i></button></div>`;
            t.status==='completed'?done.push(h):pen.push(h);
        });
        c.innerHTML=(pen.length?`<h4 style="padding:1.25rem 1.25rem .5rem;color:var(--text-secondary);font-size:.85rem;text-transform:uppercase">Folyamatban</h4>`+pen.join(''):'')+(done.length?`<h4 style="padding:1.25rem 1.25rem .5rem;color:var(--text-secondary);font-size:.85rem;text-transform:uppercase">Kész</h4>`+done.join(''):'');
    }

    // --- RENDER SHOPPING ---
    function renderShoppingView() {
        const c=document.getElementById('shopping-content'); if(!c) return;
        if(!dashboardData.shopping.length){c.innerHTML=`<div style="text-align:center;color:var(--text-secondary);padding:1.5rem">A bevásárlólista üres.</div>`;return;}
        c.innerHTML=dashboardData.shopping.map(s=>`
        <div class="shopping-item ${s.bought?'bought':''}">
            <label class="shopping-item-left checkbox-label" style="margin:0;cursor:pointer"><input type="checkbox" onchange="window.toggleShoppingItem('${s.id}')" ${s.bought?'checked':''}><span class="shopping-item-text">${s.name}</span></label>
            <button class="btn-danger-ghost" onclick="window.deleteShoppingItem('${s.id}')"><i class="fa-regular fa-trash-can"></i></button>
        </div>`).join('');
    }

    function renderAll() { renderDashboard(); renderCalendarView(); renderBillsView(); renderDocumentsView(); renderTasksView(); renderShoppingView(); }

    // --- WINDOW ACTIONS ---
    window.toggleTask = async (id) => {
        const t=dashboardData.tasks.items.find(x=>x.id===id); if(!t) return;
        t.status = t.status==='completed'?'pending':'completed';
        recalcTasks(); haptic('light'); renderDashboard(); renderTasksView();
        await SupaDB.toggleTask(id, t.status);
    };
    window.deleteTask = async (id) => {
        dashboardData.tasks.items=dashboardData.tasks.items.filter(x=>x.id!==id);
        recalcTasks(); haptic('delete'); renderDashboard(); renderTasksView();
        await SupaDB.deleteTask(id);
    };
    window.toggleShoppingItem = async (id) => {
        const s=dashboardData.shopping.find(x=>x.id===id); if(!s) return;
        s.bought=!s.bought; haptic('light'); renderShoppingView();
        await SupaDB.toggleShopping(id, s.bought);
    };
    window.deleteShoppingItem = async (id) => {
        dashboardData.shopping=dashboardData.shopping.filter(x=>x.id!==id);
        haptic('delete'); renderShoppingView();
        await SupaDB.deleteShopping(id);
    };
    window.markBillPaid = async (id) => {
        const b=dashboardData.bills.find(x=>x.id===id); if(!b) return;
        b.type='success'; b.due='Teljesítve'; haptic('success'); renderBillsView(); renderDashboard();
        await SupaDB.updateBill(id, {type:'success', due:'Teljesítve'});
    };
    window.deleteDocument = async (id) => {
        dashboardData.documents=dashboardData.documents.filter(x=>x.id!==id);
        haptic('delete'); renderDocumentsView();
        await SupaDB.deleteDocument(id);
    };
    window.deleteAppointment = async (id) => {
        dashboardData.appointments=dashboardData.appointments.filter(x=>x.id!==id);
        haptic('delete'); renderCalendarView(); renderDashboard();
        await SupaDB.deleteAppointment(id);
    };

    // --- UPLOAD ZONES ---
    function initUploadZone() {
        const z=document.getElementById('upload-zone'),f=document.getElementById('file-input'),cont=document.getElementById('upload-content');
        if(!z||!f) return;
        z.onclick=()=>f.click();
        f.onchange=(e)=>e.target.files.length&&animateUpload(cont,e.target.files[0].name,false);
        z.ondragover=(e)=>{e.preventDefault();z.classList.add('dragover');};
        z.ondragleave=()=>z.classList.remove('dragover');
        z.ondrop=(e)=>{e.preventDefault();z.classList.remove('dragover');e.dataTransfer.files.length&&animateUpload(cont,e.dataTransfer.files[0].name,false);};
    }
    function initDocsUploadZone() {
        const z=document.getElementById('docs-upload-zone'),f=document.getElementById('docs-file-input'),cont=document.getElementById('docs-upload-content');
        if(!z||!f) return;
        z.onclick=()=>f.click();
        f.onchange=(e)=>e.target.files.length&&animateUpload(cont,e.target.files[0].name,true);
        z.ondragover=(e)=>{e.preventDefault();z.classList.add('dragover');};
        z.ondragleave=()=>z.classList.remove('dragover');
        z.ondrop=(e)=>{e.preventDefault();z.classList.remove('dragover');e.dataTransfer.files.length&&animateUpload(cont,e.dataTransfer.files[0].name,true);};
    }
    function animateUpload(cont,fileName,saveDoc) {
        cont.innerHTML=`<div class="upload-state"><div class="spinner"></div><p style="font-size:.85rem;font-weight:500;margin-top:.5rem">${saveDoc?'AI kategorizálás...':'Fájl elemzése...'}</p><p style="font-size:.7rem;color:var(--text-secondary)">${fileName}</p></div>`;
        setTimeout(async()=>{
            cont.innerHTML=`<div class="upload-state" style="color:var(--primary-color)"><i class="fa-solid fa-circle-check" style="font-size:2rem"></i><p style="font-size:.85rem;font-weight:500;margin-top:.5rem">${saveDoc?'Mentve és kategorizálva!':'Sikeres feldolgozás!'}</p><p style="font-size:.7rem;color:var(--text-secondary)">${fileName}</p></div>`;
            if(saveDoc && currentUser) {
                const d=new Date().toLocaleDateString('hu-HU',{year:'numeric',month:'2-digit',day:'2-digit'});
                const doc = await SupaDB.addDocument(fileName,'Egyéb',d,'1.2 MB',currentUser.id);
                if(doc){ dashboardData.documents.unshift(doc); renderDocumentsView(); }
            }
            setTimeout(()=>{ cont.innerHTML=saveDoc?`<i class="fa-solid fa-cloud-arrow-up"></i><p style="font-weight:500;margin-bottom:.25rem">Húzd ide az új iratot vagy kattints</p><p style="font-size:.75rem">AI automatikus kategorizálás</p>`:`<i class="fa-solid fa-cloud-arrow-up"></i><p style="font-weight:500;margin-bottom:.25rem">Húzd ide a fájlt vagy kattints</p><p style="font-size:.75rem">Automatikusan feldolgozzuk az adatokat</p>`; },3000);
        },2000);
    }

    // --- NAVIGATION ---
    const navLinks=document.querySelectorAll('.nav-links li');
    const viewSections=document.querySelectorAll('.view-section');
    const pageTitle=document.getElementById('page-title');
    navLinks.forEach(link=>{
        link.addEventListener('click',()=>{
            navLinks.forEach(l=>l.classList.remove('active')); link.classList.add('active');
            if(pageTitle) pageTitle.textContent=link.querySelector('span').textContent;
            const tid='view-'+link.dataset.target;
            viewSections.forEach(s=>{s.id===tid?(s.classList.add('active'),s.style.display='block'):(s.classList.remove('active'),s.style.display='none');});
        });
    });

    // --- ADD MODAL ---
    const modal=document.getElementById('add-modal');
    const btnAdd=document.getElementById('btn-add-new');
    const btnClose=document.getElementById('btn-close-modal');
    const addForm=document.getElementById('add-item-form');
    if(btnAdd&&modal){
        const typeSelect=document.getElementById('item-type');
        const billFields=document.getElementById('bill-fields');
        const toggleBill=()=>{ if(billFields) billFields.style.display=typeSelect.value==='bill'?'block':'none'; };
        btnAdd.onclick=()=>{ modal.classList.add('active'); toggleBill(); document.getElementById('item-title').focus(); };
        btnClose.onclick=()=>modal.classList.remove('active');
        modal.onclick=(e)=>{ if(e.target===modal) modal.classList.remove('active'); };
        typeSelect.onchange=toggleBill;
        addForm.addEventListener('submit', async(e)=>{
            e.preventDefault();
            const type=typeSelect.value, title=document.getElementById('item-title').value;
            if(type==='task'){
                const t=await SupaDB.addTask(title, currentUser.id);
                if(t){ dashboardData.tasks.items.unshift(t); recalcTasks(); renderDashboard(); renderTasksView(); }
            } else if(type==='appointment'){
                const a=await SupaDB.addAppointment(title,'Hamarosan','neutral',currentUser.id);
                if(a){ dashboardData.appointments.unshift(a); renderDashboard(); renderCalendarView(); }
            } else if(type==='bill'){
                const rawAmt=document.getElementById('item-amount').value;
                const rawDue=document.getElementById('item-due').value;
                const amount=rawAmt?new Intl.NumberFormat('hu-HU').format(parseInt(rawAmt))+' Ft':'-';
                const due=rawDue?new Date(rawDue).toLocaleDateString('hu-HU',{month:'long',day:'numeric'}):'Nincs határidő';
                const isUrgent=rawDue&&(new Date(rawDue)-new Date())<3*24*60*60*1000;
                const b=await SupaDB.addBill(title,amount,due,isUrgent?'alert':'warning',currentUser.id);
                if(b){ dashboardData.bills.unshift(b); renderDashboard(); renderBillsView(); }
            }
            haptic('success'); modal.classList.remove('active'); addForm.reset();
        });
    }

    // --- SHOPPING FORM ---
    const shoppingForm=document.getElementById('shopping-form');
    if(shoppingForm){
        shoppingForm.addEventListener('submit', async(e)=>{
            e.preventDefault();
            const input=document.getElementById('shopping-input');
            const val=input.value.trim(); if(!val) return;
            const item=await SupaDB.addShopping(val, currentUser.id);
            if(item){ dashboardData.shopping.unshift(item); renderShoppingView(); input.value=''; haptic('success'); }
        });
    }

    // --- TASK FORM ---
    const taskForm=document.getElementById('task-form');
    if(taskForm){
        taskForm.addEventListener('submit', async(e)=>{
            e.preventDefault();
            const input=document.getElementById('task-input');
            const val=input.value.trim(); if(!val) return;
            const t=await SupaDB.addTask(val, currentUser.id);
            if(t){ dashboardData.tasks.items.unshift(t); recalcTasks(); renderDashboard(); renderTasksView(); input.value=''; haptic('success'); }
        });
    }

    // --- NOTIFICATIONS ---
    let swReg=null;
    function sendNotif(title,body,tag){
        if(Notification.permission!=='granted') return;
        swReg?.active?.postMessage({type:'SHOW_NOTIFICATION',title,body,tag}) || new Notification(title,{body,tag,icon:'https://ui-avatars.com/api/?name=LA&background=111827&color=fff&size=192'});
    }
    const bellBtn=document.getElementById('btn-bell');
    if(bellBtn) bellBtn.onclick=async()=>{
        if(!('Notification' in window)){alert('A böngésző nem támogatja az értesítéseket.');return;}
        if(Notification.permission==='denied'){alert('Az értesítések le vannak tiltva.');return;}
        if(Notification.permission==='granted'){haptic('light');return;}
        const p=await Notification.requestPermission();
        if(p==='granted'){haptic('success');sendNotif('🎉 Értesítések bekapcsolva!','Mostantól emlékeztetni fogunk a fontos dolgaidra.','welcome');}
    };
    if('serviceWorker' in navigator && location.protocol.startsWith('http')){
        navigator.serviceWorker.register('./sw.js').then(r=>{swReg=r;}).catch(()=>{});
    }

    // --- REAL-TIME SUBSCRIPTIONS ---
    function setupRealtime() {
        SupaDB.subscribeAll(async (table) => {
            const loaded = await SupaDB.loadAll();
            setFromLoaded(loaded);
            renderAll();
        });
    }

    // --- AUTH UI ---
    const authContainer=document.getElementById('auth-container');
    const appContainer=document.getElementById('app-container');

    async function showApp(user) {
        currentUser = user;
        const name = user.user_metadata?.full_name || user.email.split('@')[0];
        const ne=document.getElementById('user-name-sidebar'), ee=document.getElementById('user-email-sidebar'), ae=document.getElementById('user-avatar-sidebar');
        if(ne) ne.textContent=name; if(ee) ee.textContent=user.email;
        if(ae) ae.src=`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f3f4f6&color=111827`;
        if(authContainer) authContainer.style.display='none';
        if(appContainer) appContainer.style.display='flex';
        const loaded = await SupaDB.loadAll();
        setFromLoaded(loaded);
        renderAll();
        initDocsUploadZone();
        setupRealtime();
    }

    function showAuth() {
        currentUser=null;
        if(authContainer) authContainer.style.display='flex';
        if(appContainer) appContainer.style.display='none';
    }

    // Toggle forms
    document.getElementById('switch-to-register')?.addEventListener('click',(e)=>{e.preventDefault();document.getElementById('login-form-wrapper').style.display='none';document.getElementById('register-form-wrapper').style.display='block';});
    document.getElementById('switch-to-login')?.addEventListener('click',(e)=>{e.preventDefault();document.getElementById('register-form-wrapper').style.display='none';document.getElementById('login-form-wrapper').style.display='block';});

    // Login
    document.getElementById('auth-login-form')?.addEventListener('submit', async(e)=>{
        e.preventDefault();
        const email=document.getElementById('login-email').value.trim();
        const password=document.getElementById('login-password').value;
        const errEl=document.getElementById('login-error');
        const {data,error}=await SupaDB.login(email,password);
        if(error){if(errEl){errEl.textContent='Hibás email cím vagy jelszó!';errEl.style.display='block';}haptic('delete');}
        else { if(errEl) errEl.style.display='none'; showApp(data.user); }
    });

    // Register
    document.getElementById('auth-register-form')?.addEventListener('submit', async(e)=>{
        e.preventDefault();
        const name=document.getElementById('register-name').value.trim();
        const email=document.getElementById('register-email').value.trim();
        const password=document.getElementById('register-password').value;
        const errEl=document.getElementById('register-error');
        const {data,error}=await SupaDB.register(email,password,name);
        if(error){if(errEl){errEl.textContent=error.message;errEl.style.display='block';}haptic('delete');}
        else { if(errEl) errEl.style.display='none'; showApp(data.user); }
    });

    // Logout
    const doLogout=async()=>{ await SupaDB.logout(); showAuth(); };
    document.getElementById('btn-logout')?.addEventListener('click',doLogout);
    document.getElementById('btn-logout-mobile')?.addEventListener('click',doLogout);

    // --- INIT: check existing session ---
    const session = await SupaDB.getSession();
    if(session?.user) { showApp(session.user); }
    else { showAuth(); }
});
