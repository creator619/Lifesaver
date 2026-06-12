document.addEventListener('DOMContentLoaded', () => {
    
    // Set current date
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('hu-HU', dateOptions);
    document.getElementById('current-date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

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

    function recalculateTasks() {
        dashboardData.tasks.total = dashboardData.tasks.items.length;
        dashboardData.tasks.completed = dashboardData.tasks.items.filter(t => t.status === 'completed').length;
    }
    
    recalculateTasks();

    function saveData() {
        localStorage.setItem('lifeAdminData', JSON.stringify(dashboardData));
    }

    const dashboardContent = document.getElementById('dashboard-content');

    function renderDashboard() {
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
                                <input type="checkbox" data-index="${index}" ${task.status === 'completed' ? 'checked' : ''}>
                                <span>${task.title}</span>
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

    renderDashboard();
    renderCalendarView();

    // Init Drag and Drop
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

    // Init Tasks functionality
    function initTasks() {
        const taskList = document.getElementById('task-list');
        const taskCounter = document.getElementById('task-counter');
        const taskProgress = document.getElementById('task-progress');

        if (!taskList) return;

        taskList.addEventListener('change', (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
                const index = e.target.dataset.index;
                const isChecked = e.target.checked;
                
                // Update internal data
                dashboardData.tasks.items[index].status = isChecked ? 'completed' : 'pending';
                recalculateTasks();
                saveData();
                
                // Update visual styling
                const label = e.target.closest('.checkbox-label');
                if (isChecked) {
                    label.classList.add('completed-task');
                } else {
                    label.classList.remove('completed-task');
                }
                
                // Update progress bar and counter
                taskCounter.textContent = `${dashboardData.tasks.completed} / ${dashboardData.tasks.total} kész`;
                taskProgress.style.width = `${(dashboardData.tasks.completed / dashboardData.tasks.total) * 100}%`;
            }
        });
    }

    initTasks();

    const navLinks = document.querySelectorAll('.nav-links li');
    const viewSections = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');

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
        btnAdd.addEventListener('click', () => {
            modal.classList.add('active');
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
                dashboardData.bills.push({ title: title, amount: "-", due: "Feldolgozás alatt", type: "neutral" });
            }
            
            saveData();
            
            // Re-render dashboard
            renderDashboard();
            renderCalendarView();
            initUploadZone();
            initTasks();
            
            // Close and reset
            modal.classList.remove('active');
            addForm.reset();
        });
    }
});
