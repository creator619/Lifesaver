// ============================================================
// Supabase Integration Layer – LifeAdmin
// ============================================================
const SUPABASE_URL = 'https://zzckwunfiegbbcllkzfd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_rKjgNmrpWmKe6xaSWI3Rfg_q6t92g8V';
const { createClient } = window.supabase;
const _db = createClient(SUPABASE_URL, SUPABASE_KEY);

window.SupaDB = {

    // --- AUTH ---
    async login(email, password) {
        return await _db.auth.signInWithPassword({ email, password });
    },
    async register(email, password, name) {
        return await _db.auth.signUp({ email, password, options: { data: { full_name: name } } });
    },
    async logout() {
        await _db.auth.signOut();
    },
    async getSession() {
        const { data } = await _db.auth.getSession();
        return data.session;
    },
    onAuthChange(cb) {
        _db.auth.onAuthStateChange(cb);
    },

    // --- LOAD ALL ---
    async loadAll() {
        const [s, a, b, t, d] = await Promise.all([
            _db.from('shopping_items').select('*').order('created_at'),
            _db.from('appointments').select('*').order('created_at'),
            _db.from('bills').select('*').order('created_at'),
            _db.from('tasks').select('*').order('created_at'),
            _db.from('documents').select('*').order('created_at')
        ]);
        return {
            shopping:     (s.data || []),
            appointments: (a.data || []),
            bills:        (b.data || []),
            tasks:        (t.data || []),
            documents:    (d.data || [])
        };
    },

    // --- SHOPPING ---
    async addShopping(name, uid)        { const { data } = await _db.from('shopping_items').insert({ name, bought: false, created_by: uid }).select().single(); return data; },
    async toggleShopping(id, bought)    { await _db.from('shopping_items').update({ bought }).eq('id', id); },
    async deleteShopping(id)            { await _db.from('shopping_items').delete().eq('id', id); },

    // --- TASKS ---
    async addTask(title, uid)           { const { data } = await _db.from('tasks').insert({ title, status: 'pending', created_by: uid }).select().single(); return data; },
    async toggleTask(id, status)        { await _db.from('tasks').update({ status }).eq('id', id); },
    async deleteTask(id)                { await _db.from('tasks').delete().eq('id', id); },

    // --- APPOINTMENTS ---
    async addAppointment(title, time, type, uid) { const { data } = await _db.from('appointments').insert({ title, time, type, created_by: uid }).select().single(); return data; },
    async deleteAppointment(id)         { await _db.from('appointments').delete().eq('id', id); },

    // --- BILLS ---
    async addBill(title, amount, due, type, uid) { const { data } = await _db.from('bills').insert({ title, amount, due, type, created_by: uid }).select().single(); return data; },
    async updateBill(id, updates)       { await _db.from('bills').update(updates).eq('id', id); },

    // --- DOCUMENTS ---
    async addDocument(name, folder, date, size, uid) { const { data } = await _db.from('documents').insert({ name, folder, date, size, created_by: uid }).select().single(); return data; },
    async deleteDocument(id)            { await _db.from('documents').delete().eq('id', id); },

    // --- REAL-TIME (valós idejű szinkronizáció) ---
    subscribeAll(onChange) {
        ['shopping_items','appointments','bills','tasks','documents'].forEach(table => {
            _db.channel('rt_' + table)
                .on('postgres_changes', { event: '*', schema: 'public', table }, payload => onChange(table, payload))
                .subscribe();
        });
    }
};
