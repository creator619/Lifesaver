document.addEventListener('DOMContentLoaded', () => {
    
    // Date and Greeting logic handled in updateGreeting()

    // Default Data
    const defaultData = {
        appointments: [
            { title: "Fogorvos", time: "Ma, 14:30", type: "warning" },
            { title: "Autó szerviz", time: "Holnap, 08:00", type: "neutral" }
        ],
        bills: [
            { title: "E.ON Villanyszámla", amount: "12 450 Ft", due: "Ma lejár", type: "alert" },
            { title: "Közös költség", amount: "25 000 Ft", due: "3 nap múlva", type: "warning" }
        ],
        tasks: {
            completed: 0,
            total: 2,
            items: [
                { title: "Postára menni", status: "pending" },
                { title: "Havi riport átnézése", status: "pending" }
            ]
        }
    };

    let dashboardData = JSON.parse(localStorage.getItem('lifeAdminData'));
    
    if (!dashboardData) {
        dashboardData = defaultData;
    }

    // Initialize shopping data if missing or in old string format
    if (!dashboardData.shopping || (dashboardData.shopping.length > 0 && typeof dashboardData.shopping[0] === 'string')) {
        dashboardData.shopping = [
            { name: "Kenyér", bought: false },
            { name: "Tej (2l)", bought: false },
            { name: "Paradicsom", bought: false }
        ];
        saveData();
    }

    if (!dashboardData.documents) {
        dashboardData.documents = [
            { name: "Lakásbérleti_szerződés.pdf", folder: "Szerződések", date: "2026. 05. 10.", size: "2.4 MB" },
            { name: "Mosógép_garancia.jpg", folder: "Garanciák", date: "2026. 06. 01.", size: "1.1 MB" },
            { name: "Vérvétel_eredmény.pdf", folder: "Egészségügy", date: "2026. 06. 11.", size: "0.8 MB" }
        ];
        saveData();
    }

    function recalculateTasks() {
        dashboardData.tasks.total = dashboardData.tasks.items.length;
        dashboardData.tasks.completed = dashboardData.tasks.items.filter(t => t.status === 'completed').length;
    }
    
    recalculateTasks();

    function saveData() {
        localStorage.setItem('lifeAdminData', JSON.stringify(dashboardData));
    }

    // Haptic feedback utility (Android Vibration API)
    function haptic(type = 'light') {
        if (!navigator.vibrate) return;
        const patterns = {
            light:   [50],              // feladat pipálás, bevásárlás
            medium:  [80],              // sikeres mentés
            success: [60, 80, 100],     // számla fizetve, elem hozzáadva
            delete:  [80, 60, 80],      // törlés
        };
        navigator.vibrate(patterns[type] || patterns.light);
    }

    function updateGreeting() {
        // Set date
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = new Date().toLocaleDateString('hu-HU', dateOptions);
        document.getElementById('current-date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

        // Dynamic greeting based on time
        const hour = new Date().getHours();
        let greeting = "Szia!";
        
        if (hour >= 5 && hour < 10) greeting = "Jó reggelt!";
        else if (hour >= 10 && hour < 14) greeting = "Szép napot!";
        else if (hour >= 14 && hour < 18) greeting = "Kellemes délutánt!";
        else greeting = "Jó estét!";
        
        // Smart summary based on data
        let pendingTasks = dashboardData.tasks.items.filter(t => t.status === 'pending').length;
        let unpaidBills = dashboardData.bills.filter(b => b.type !== 'success').length;
        
        let subtitle = "";
        if (pendingTasks === 0 && unpaidBills === 0) {
            subtitle = "Minden teendő és számla elintézve. Pihenj egyet! 🎉";
        } else {
            const parts = [];
            if (pendingTasks > 0) parts.push(`${pendingTasks} feladat`);
            if (unpaidBills > 0) parts.push(`${unpaidBills} számla`);
            subtitle = `Ma még ${parts.join(' és ')} vár rád.`;
        }

        const greetingEl = document.getElementById('greeting-title');
        const subtitleEl = document.getElementById('greeting-subtitle');
        
        if (greetingEl) greetingEl.textContent = greeting;
        if (subtitleEl) subtitleEl.textContent = subtitle;
    }

    const dashboardContent = document.getElementById('dashboard-content');

    function renderDashboard() {
        updateGreeting();
        dashboardContent.innerHTML = `
            <!-- Időpontok Kártya -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Közelgő Időpontok</div>
                    <div class="card-action">Mind <i class="fa-solid fa-chevron-right" style="font-size: 0.7rem; margin-left: 2px;"></i></div>
                </div>
                <div class="card-body">
                    ${dashboardData.appointments.map(app => `
                        <div class="list-item">
                            <div class="item-info">
                                <span class="item-title">${app.title}</span>
                                <span class="item-desc">${app.time}</span>
                            </div>
                            <span class="tag tag-${app.type}">${app.time.includes('Ma') ? 'Ma' : 'Hamarosan'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Számlák Kártya -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Fizetendő Számlák</div>
                    <div class="card-action">Új számla</div>
                </div>
                <div class="card-body">
                    ${dashboardData.bills.map(bill => `
                        <div class="list-item">
                            <div class="item-info">
                                <span class="item-title">${bill.title}</span>
                                <span class="item-desc">${bill.amount}</span>
                            </div>
                            <span class="tag tag-${bill.type}">${bill.due}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Feladatok Kártya -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Napi Feladatok</div>
                </div>
                <div class="card-body">
                    <div class="progress-header">
                        <span>Folyamatban</span>
                        <span id="task-counter">${dashboardData.tasks.completed} / ${dashboardData.tasks.total} kész</span>
                    </div>
                    <div class="progress-container">
                        <div id="task-progress" class="progress-bar" style="width: ${(dashboardData.tasks.completed / dashboardData.tasks.total) * 100}%"></div>
                    </div>
                    <div id="task-list" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.6rem;">
                        ${dashboardData.tasks.items.map((task, index) => `
                            <label class="checkbox-label ${task.status === 'completed' ? 'completed-task' : ''}">
                                <input type="checkbox" onchange="window.toggleTask(${index})" ${task.status === 'completed' ? 'checked' : ''}>
                                <span style="flex: 1;">${task.title}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Feltöltés Kártya -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Új Dokumentum / Számla</div>
                </div>
                <div class="card-body" style="height: calc(100% - 2rem); display: flex; align-items: center;">
                    <div class="upload-zone" id="upload-zone" style="width: 100%;">
                        <input type="file" id="file-input" style="display: none;" multiple>
                        <div id="upload-content">
                            <i class="fa-solid fa-cloud-arrow-up"></i>
                            <p style="font-weight: 500; margin-bottom: 0.25rem;">Húzd ide a fájlt vagy kattints</p>
                            <p style="font-size: 0.75rem;">Automatikusan feldolgozzuk az adatokat</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderCalendarView() {
        const container = document.getElementById('calendar-content');
        if (!container) return;
        
        if (dashboardData.appointments.length === 0) {
            container.innerHTML = `<div class="card"><div class="card-body" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Nincsenek közelgő időpontok.</div></div>`;
            return;
        }

        container.innerHTML = `
            <div class="appointment-list">
                ${dashboardData.appointments.map(app => {
                    let dayStr = "12";
                    let monthStr = "JÚN";
                    if (app.time.toLowerCase().includes("ma")) { dayStr = "12"; monthStr = "MA"; }
                    else if (app.time.toLowerCase().includes("holnap")) { dayStr = "13"; monthStr = "HOLN"; }
                    else { dayStr = "15"; monthStr = "JÚN"; }

                    return `
                    <div class="appointment-card">
                        <div class="appointment-date">
                            <span class="day">${dayStr}</span>
                            <span class="month">${monthStr}</span>
                        </div>
                        <div class="appointment-details">
                            <h3>${app.title}</h3>
                            <p><i class="fa-regular fa-clock"></i> ${app.time}</p>
                        </div>
                        <div class="card-action" style="cursor: pointer; padding: 0.5rem;"><i class="fa-solid fa-ellipsis-vertical"></i></div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderBillsView() {
        const container = document.getElementById('bills-content');
        if (!container) return;

        let dueTotal = 0;
        let paidTotal = 0;
        
        dashboardData.bills.forEach(bill => {
            const amountNum = parseInt(bill.amount.replace(/[^0-9]/g, '')) || 0;
            if (bill.type === 'success') {
                paidTotal += amountNum;
            } else {
                dueTotal += amountNum;
            }
        });

        const dueEl = document.getElementById('total-due');
        const paidEl = document.getElementById('total-paid');
        if (dueEl) dueEl.textContent = new Intl.NumberFormat('hu-HU').format(dueTotal) + " Ft";
        if (paidEl) paidEl.textContent = new Intl.NumberFormat('hu-HU').format(paidTotal) + " Ft";

        if (dashboardData.bills.length === 0) {
            container.innerHTML = `<div class="card"><div class="card-body" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Nincsenek számlák.</div></div>`;
            return;
        }

        container.innerHTML = `
            <div class="appointment-list">
                ${dashboardData.bills.map((bill, index) => {
                    const isPaid = bill.type === 'success';
                    return `
                    <div class="appointment-card" style="${isPaid ? 'opacity: 0.6;' : ''}">
                        <div class="appointment-date" style="background: ${isPaid ? '#f0fdf4' : 'var(--bg-main)'}; border-color: ${isPaid ? '#bbf7d0' : 'var(--border-color)'};">
                            <i class="fa-solid fa-file-invoice-dollar" style="font-size: 1.5rem; color: ${isPaid ? '#16a34a' : 'var(--text-secondary)'};"></i>
                        </div>
                        <div class="appointment-details">
                            <h3 style="text-decoration: ${isPaid ? 'line-through' : 'none'};">${bill.title}</h3>
                            <p style="color: ${bill.type === 'alert' ? '#991b1b' : 'var(--text-secondary)'}; font-weight: 500;">
                                ${bill.amount} &bull; ${bill.due}
                            </p>
                        </div>
                        <div class="card-action">
                            ${!isPaid ? 
                                `<button class="btn-sm" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-sm); cursor: pointer; color: var(--text-primary); font-weight: 500;" onclick="window.markBillPaid(${index})"><i class="fa-solid fa-check" style="color: #16a34a;"></i> Fizetve</button>` 
                                : '<span class="tag tag-success">Teljesítve</span>'
                            }
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderDocumentsView() {
        const container = document.getElementById('documents-content');
        if (!container) return;

        if (!dashboardData.documents || dashboardData.documents.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">Nincsenek feltöltött iratok.</div>`;
            return;
        }

        container.innerHTML = dashboardData.documents.map((doc, index) => `
            <div class="document-item">
                <div class="doc-info">
                    <div class="doc-icon">
                        <i class="fa-regular ${doc.name.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' : 'fa-image'}"></i>
                    </div>
                    <div class="doc-details">
                        <h4>${doc.name}</h4>
                        <p>${doc.folder} &bull; ${doc.date} &bull; ${doc.size}</p>
                    </div>
                </div>
                <div class="card-action" style="display:flex; gap:0.5rem; align-items: center;">
                    <button class="btn-icon" style="width:32px; height:32px;"><i class="fa-solid fa-download"></i></button>
                    <button class="btn-danger-ghost" onclick="window.deleteDocument(${index})"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            </div>
        `).join('');
    }

    window.deleteDocument = function(index) {
        dashboardData.documents.splice(index, 1);
        saveData();
        haptic('delete');
        renderDocumentsView();
    };

    function renderTasksView() {
        const container = document.getElementById('tasks-content');
        if (!container) return;

        if (dashboardData.tasks.items.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">Nincsenek feladatok.</div>`;
            return;
        }

        const pendingTasks = [];
        const completedTasks = [];
        
        dashboardData.tasks.items.forEach((task, index) => {
            const taskHtml = `
                <div class="shopping-item" style="padding: 1rem 1.25rem;">
                    <label class="checkbox-label ${task.status === 'completed' ? 'completed-task' : ''}" style="margin: 0; cursor: pointer; width: 100%;">
                        <input type="checkbox" onchange="window.toggleTask(${index})" ${task.status === 'completed' ? 'checked' : ''}>
                        <span style="flex: 1;">${task.title}</span>
                    </label>
                    <button class="btn-danger-ghost" onclick="window.deleteTask(${index})"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            `;
            if (task.status === 'completed') completedTasks.push(taskHtml);
            else pendingTasks.push(taskHtml);
        });

        let html = '';
        if (pendingTasks.length > 0) {
            html += `<h4 style="padding: 1.25rem 1.25rem 0.5rem 1.25rem; color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase;">Folyamatban</h4>`;
            html += pendingTasks.join('');
        }
        if (completedTasks.length > 0) {
            html += `<h4 style="padding: 1.25rem 1.25rem 0.5rem 1.25rem; color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase;">Kész</h4>`;
            html += completedTasks.join('');
        }

        container.innerHTML = html;
    }

    window.toggleTask = function(index) {
        dashboardData.tasks.items[index].status = dashboardData.tasks.items[index].status === 'completed' ? 'pending' : 'completed';
        recalculateTasks();
        saveData();
        haptic('light');
        renderDashboard();
        renderTasksView();
    };

    window.deleteTask = function(index) {
        dashboardData.tasks.items.splice(index, 1);
        recalculateTasks();
        saveData();
        haptic('delete');
        renderDashboard();
        renderTasksView();
    };

    function renderShoppingView() {
        const container = document.getElementById('shopping-content');
        if (!container) return;

        if (!dashboardData.shopping || dashboardData.shopping.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">A bevásárlólista üres.</div>`;
            return;
        }

        container.innerHTML = dashboardData.shopping.map((item, index) => `
            <div class="shopping-item ${item.bought ? 'bought' : ''}">
                <label class="shopping-item-left checkbox-label" style="margin: 0; cursor: pointer;">
                    <input type="checkbox" onchange="window.toggleShoppingItem(${index})" ${item.bought ? 'checked' : ''}>
                    <span class="shopping-item-text">${item.name}</span>
                </label>
                <button class="btn-danger-ghost" onclick="window.deleteShoppingItem(${index})"><i class="fa-regular fa-trash-can"></i></button>
            </div>
        `).join('');
    }

    window.toggleShoppingItem = function(index) {
        dashboardData.shopping[index].bought = !dashboardData.shopping[index].bought;
        saveData();
        haptic('light');
        renderShoppingView();
    };

    window.deleteShoppingItem = function(index) {
        dashboardData.shopping.splice(index, 1);
        saveData();
        haptic('delete');
        renderShoppingView();
    };

    window.markBillPaid = function(index) {
        dashboardData.bills[index].type = 'success';
        dashboardData.bills[index].due = 'Teljesítve';
        saveData();
        haptic('success');
        renderBillsView();
        renderDashboard();
    };

    renderDashboard();
    renderCalendarView();
    renderBillsView();
    renderDocumentsView();
    renderTasksView();
    renderShoppingView();

    // Init Drag and Drop for Dashboard
    function initUploadZone() {
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');
        const uploadContent = document.getElementById('upload-content');

        if (!uploadZone) return;

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if(e.target.files.length) handleFiles(e.target.files);
        });

        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            if(e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        });

        function handleFiles(files) {
            const fileName = files[0].name;
            
            uploadContent.innerHTML = `
                <div class="upload-state">
                    <div class="spinner"></div>
                    <p style="font-size: 0.85rem; font-weight: 500; margin-top: 0.5rem;">Fájl elemzése...</p>
                    <p style="font-size: 0.7rem; color: var(--text-secondary);">${fileName}</p>
                </div>
            `;

            setTimeout(() => {
                uploadContent.innerHTML = `
                    <div class="upload-state" style="color: var(--primary-color);">
                        <i class="fa-solid fa-circle-check" style="font-size: 2rem;"></i>
                        <p style="font-size: 0.85rem; font-weight: 500; margin-top: 0.5rem;">Sikeres feldolgozás!</p>
                        <p style="font-size: 0.7rem; color: var(--text-secondary);">${fileName}</p>
                    </div>
                `;
                
                setTimeout(() => {
                    uploadContent.innerHTML = `
                        <i class="fa-solid fa-cloud-arrow-up"></i>
                        <p style="font-weight: 500; margin-bottom: 0.25rem;">Húzd ide a fájlt vagy kattints</p>
                        <p style="font-size: 0.75rem;">Automatikusan feldolgozzuk az adatokat</p>
                    `;
                }, 3000);
            }, 2000);
        }
    }

    initUploadZone();

    // Init Drag and Drop for Documents Module
    function initDocsUploadZone() {
        const uploadZone = document.getElementById('docs-upload-zone');
        const fileInput = document.getElementById('docs-file-input');
        const uploadContent = document.getElementById('docs-upload-content');

        if (!uploadZone) return;

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if(e.target.files.length) handleFiles(e.target.files);
        });

        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            if(e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        });

        function handleFiles(files) {
            const fileName = files[0].name;
            
            uploadContent.innerHTML = `
                <div class="upload-state">
                    <div class="spinner"></div>
                    <p style="font-size: 0.85rem; font-weight: 500; margin-top: 0.5rem;">AI kategorizálás folyamatban...</p>
                    <p style="font-size: 0.7rem; color: var(--text-secondary);">${fileName}</p>
                </div>
            `;

            setTimeout(() => {
                uploadContent.innerHTML = `
                    <div class="upload-state" style="color: var(--primary-color);">
                        <i class="fa-solid fa-circle-check" style="font-size: 2rem;"></i>
                        <p style="font-size: 0.85rem; font-weight: 500; margin-top: 0.5rem;">Mentve és kategorizálva!</p>
                        <p style="font-size: 0.7rem; color: var(--text-secondary);">${fileName}</p>
                    </div>
                `;
                
                // Add to data
                dashboardData.documents.unshift({ 
                    name: fileName, 
                    folder: "Egyéb", // AI chose "Egyéb" as mock
                    date: new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit' }), 
                    size: "1.2 MB" 
                });
                saveData();
                renderDocumentsView();

                setTimeout(() => {
                    uploadContent.innerHTML = `
                        <i class="fa-solid fa-cloud-arrow-up"></i>
                        <p style="font-weight: 500; margin-bottom: 0.25rem;">Húzd ide az új iratot vagy kattints</p>
                        <p style="font-size: 0.75rem;">AI automatikus kategorizálás</p>
                    `;
                }, 3000);
            }, 2500);
        }
    }

    initDocsUploadZone();

    // Task Add form
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('task-input');
            const val = input.value.trim();
            if (val) {
                dashboardData.tasks.items.unshift({ title: val, status: 'pending' });
                recalculateTasks();
                saveData();
                renderDashboard();
                renderTasksView();
                input.value = '';
            }
        });
    }

    const navLinks = document.querySelectorAll('.nav-links li');
    const viewSections = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');

    // Shopping Add form
    const shoppingForm = document.getElementById('shopping-form');
    if (shoppingForm) {
        shoppingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('shopping-input');
            const val = input.value.trim();
            if (val) {
                dashboardData.shopping.unshift({ name: val, bought: false });
                saveData();
                renderShoppingView();
                input.value = '';
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Update active state in sidebar
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Update page title
            const titleText = link.querySelector('span').textContent;
            pageTitle.textContent = titleText;

            // Show corresponding view
            const targetId = 'view-' + link.dataset.target;
            viewSections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.add('active');
                    section.style.display = 'block';
                } else {
                    section.classList.remove('active');
                    section.style.display = 'none';
                }
            });
        });
    });

    // Modal Logic
    const modal = document.getElementById('add-modal');
    const btnAdd = document.getElementById('btn-add-new');
    const btnClose = document.getElementById('btn-close-modal');
    const addForm = document.getElementById('add-item-form');

    if (btnAdd && modal) {
        const itemTypeSelect = document.getElementById('item-type');
        const billFields = document.getElementById('bill-fields');

        function toggleBillFields() {
            billFields.style.display = itemTypeSelect.value === 'bill' ? 'block' : 'none';
        }

        btnAdd.addEventListener('click', () => {
            modal.classList.add('active');
            toggleBillFields(); // Show/hide based on currently selected type
            document.getElementById('item-title').focus();
        });

        btnClose.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });

        // Update fields whenever type dropdown changes
        itemTypeSelect.addEventListener('change', toggleBillFields);

        addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const type = document.getElementById('item-type').value;
            const title = document.getElementById('item-title').value;

            if (type === 'task') {
                dashboardData.tasks.items.push({ title: title, status: 'pending' });
                recalculateTasks();
            } else if (type === 'appointment') {
                dashboardData.appointments.push({ title: title, time: "Hamarosan", type: "neutral" });
            } else if (type === 'bill') {
                const rawAmount = document.getElementById('item-amount').value;
                const rawDue = document.getElementById('item-due').value;
                const amount = rawAmount 
                    ? new Intl.NumberFormat('hu-HU').format(parseInt(rawAmount)) + ' Ft'
                    : '-';
                const dueDate = rawDue
                    ? new Date(rawDue).toLocaleDateString('hu-HU', { month: 'long', day: 'numeric' })
                    : 'Nincs határidő';
                const isUrgent = rawDue && (new Date(rawDue) - new Date()) < 3 * 24 * 60 * 60 * 1000;
                dashboardData.bills.push({ 
                    title, 
                    amount, 
                    due: dueDate, 
                    type: isUrgent ? 'alert' : 'warning' 
                });
            }
            
            haptic('success');
            saveData();
            
            // Re-render dashboard
            renderDashboard();
            renderCalendarView();
            renderBillsView();
            renderTasksView();
            initUploadZone();
            
            // Close and reset
            modal.classList.remove('active');
            addForm.reset();
        });
    }

    // --- Notification System ---
    let swRegistration = null;

    function sendNotification(title, body, tag) {
        if (Notification.permission !== 'granted') return;

        // Try via Service Worker first (shows even when app is closed)
        if (swRegistration && swRegistration.active) {
            swRegistration.active.postMessage({ type: 'SHOW_NOTIFICATION', title, body, tag });
        } else {
            // Fallback: direct Notification API (works when app is open)
            new Notification(title, {
                body,
                tag,
                icon: 'https://ui-avatars.com/api/?name=LA&background=111827&color=fff&size=192'
            });
        }
    }

    function checkAndNotify() {
        if (Notification.permission !== 'granted') return;

        const urgentBills = dashboardData.bills.filter(b =>
            b.type !== 'success' && (b.due.toLowerCase().includes('ma') || b.due.toLowerCase().includes('lejár'))
        );
        if (urgentBills.length > 0) {
            sendNotification(
                '💸 Lejáró számla!',
                `Ma esedékes: ${urgentBills.map(b => b.title).join(', ')}`,
                'bill-due'
            );
        }

        const todayApps = dashboardData.appointments.filter(a =>
            a.time.toLowerCase().includes('ma')
        );
        if (todayApps.length > 0) {
            sendNotification(
                '📅 Mai időpontod van!',
                `${todayApps.map(a => `${a.title} – ${a.time}`).join(', ')}`,
                'appointment-today'
            );
        }

        const pending = dashboardData.tasks.items.filter(t => t.status === 'pending').length;
        if (pending >= 3) {
            sendNotification(
                '✅ Feladatok várnak rád',
                `${pending} befejezetlen feladatod van még ma.`,
                'tasks-pending'
            );
        }
    }

    async function requestNotificationPermission() {
        if (!('Notification' in window)) {
            alert('A böngésződ sajnos nem támogatja az értesítéseket.');
            return;
        }

        if (Notification.permission === 'denied') {
            alert('Az értesítések le vannak tiltva. Böngésző beállításokban engedélyezd a LifeAdmin oldalt.');
            return;
        }

        if (Notification.permission === 'granted') {
            checkAndNotify();
            haptic('light');
            return;
        }

        // Ask for permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            haptic('success');
            sendNotification(
                '🎉 Értesítések bekapcsolva!',
                'Mostantól emlékeztetni fogunk a fontos dolgaidra.',
                'welcome'
            );
        }
    }

    // Bell button
    const bellBtn = document.getElementById('btn-bell');
    if (bellBtn) {
        bellBtn.addEventListener('click', () => {
            requestNotificationPermission();
        });
    }

    // Register Service Worker (only on http/https, not file://)
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then(registration => {
                swRegistration = registration;
                console.log('ServiceWorker registered');
                setTimeout(checkAndNotify, 3000);
            }, err => {
                console.warn('ServiceWorker failed:', err);
            });
        });
    }
});
