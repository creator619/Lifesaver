document.addEventListener('DOMContentLoaded', () => {
    
    // Set current date
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('hu-HU', dateOptions);
    document.getElementById('current-date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    // Mock Data
    const dashboardData = {
        appointments: [
            { title: "Fogorvos", time: "Ma, 14:30", type: "warning" },
            { title: "Autó szerviz", time: "Holnap, 08:00", type: "neutral" }
        ],
        bills: [
            { title: "E.ON Villanyszámla", amount: "12 450 Ft", due: "Ma lejár", type: "alert" },
            { title: "Közös költség", amount: "25 000 Ft", due: "3 nap múlva", type: "warning" }
        ],
        tasks: {
            completed: 2,
            total: 5,
            items: [
                { title: "Postára menni", status: "pending" },
                { title: "Havi riport átnézése", status: "pending" }
            ]
        }
    };

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
                        <span>${dashboardData.tasks.completed} / ${dashboardData.tasks.total} kész</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${(dashboardData.tasks.completed / dashboardData.tasks.total) * 100}%"></div>
                    </div>
                    <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.6rem;">
                        ${dashboardData.tasks.items.map(task => `
                            <label class="checkbox-label">
                                <input type="checkbox">
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
                    <div class="upload-zone" style="width: 100%;">
                        <i class="fa-solid fa-cloud-arrow-up"></i>
                        <p style="font-weight: 500; margin-bottom: 0.25rem;">Húzd ide a fájlt a feltöltéshez</p>
                        <p style="font-size: 0.75rem;">Automatikusan feldolgozzuk az adatokat</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderDashboard();

    const navLinks = document.querySelectorAll('.nav-links li');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
});
