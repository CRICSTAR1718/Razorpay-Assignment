const API_BASE = 'http://localhost:7002 || https://razorpay-assignment.onrender.com/';

const els = {
    authCard: document.getElementById('authCard'),
    mainCard: document.getElementById('mainCard'),
    authMessage: document.getElementById('authMessage'),
    userSummary: document.getElementById('userSummary'),
    btnLogout: document.getElementById('btnLogout'),
    btnRefresh: document.getElementById('btnRefresh'),

    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),

    createForm: document.getElementById('createForm'),

    reimbursementsMessage: document.getElementById('reimbursementsMessage'),
    reimbursementsTableBody: document.querySelector('#reimbursementsTable tbody'),
    btnLoadForUser: document.getElementById('btnLoadForUser'),
    targetUserId: document.getElementById('targetUserId'),

    approveMessage: document.getElementById('approveMessage'),
    approveGrid: document.getElementById('approveGrid'),

    tabs: document.querySelectorAll('.tab'),
    panels: document.querySelectorAll('.panel'),
};

function setMessage(el, type, message) {
    el.className = `message ${type || ''}`.trim();
    el.textContent = message || '';
}

function formDataToJson(form) {
    const fd = new FormData(form);
    const obj = {};
    for (const [k, v] of fd.entries()) obj[k] = v;
    return obj;
}

function setAuthedUI({ authed, user }) {
    if (authed) {
        els.authCard.hidden = true;
        els.mainCard.hidden = false;
        els.btnLogout.hidden = false;
        els.userSummary.textContent = user
            ? `Logged in as ${user.email} (role: ${user.role}, userId: ${user.userId})`
            : 'Logged in.';
    } else {
        els.authCard.hidden = false;
        els.mainCard.hidden = true;
        els.btnLogout.hidden = true;
        els.userSummary.textContent = '';
    }
}

async function apiFetch(path, { method = 'GET', body } = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
    });

    let data;
    try {
        data = await res.json();
    } catch (_) {
        // ignore
    }

    if (!res.ok) {
        const msg = data?.message || `Request failed (${res.status})`;
        throw new Error(msg);
    }
    return data;
}

async function register(payload) {
    return apiFetch('/rest/onboardings/register', { method: 'POST', body: payload });
}

async function login(payload) {
    return apiFetch('/rest/onboardings/login', { method: 'POST', body: payload });
}

async function logout() {
    return apiFetch('/rest/onboardings/logout', { method: 'POST', body: undefined });
}

async function loadReimbursements({ userId } = {}) {
    const msgEl = els.reimbursementsMessage;
    setMessage(msgEl, '', 'Loading...');
    els.reimbursementsTableBody.innerHTML = '';

    try {
        const data = userId
            ? await apiFetch(`/rest/reimbursements/${encodeURIComponent(userId)}`)
            : await apiFetch('/rest/reimbursements');

        const reimbursements = data?.data?.reimbursements || [];

        if (reimbursements.length === 0) {
            setMessage(msgEl, '', 'No reimbursements found.');
            return;
        }

        const rows = reimbursements
            .map((r) => {
                const amount = typeof r.amount === 'number' ? r.amount.toFixed(2) : r.amount;
                return `
          <tr>
            <td>${r.reimbursementId}</td>
            <td>${escapeHtml(r.title || '')}</td>
            <td>${escapeHtml(r.description || '')}</td>
            <td>${amount}</td>
            <td>${escapeHtml(r.status || '')}</td>
            <td>
              <button class="btn btn-small" data-action="approve" data-id="${r.reimbursementId}">Approve</button>
              <button class="btn btn-small btn-danger" data-action="reject" data-id="${r.reimbursementId}">Reject</button>
            </td>
          </tr>`;
            })
            .join('');

        els.reimbursementsTableBody.innerHTML = rows;
        setMessage(msgEl, 'ok', `Loaded ${reimbursements.length} reimbursements.`);

        // also refresh approve grid based on same list
        renderApproveGrid(reimbursements);
    } catch (e) {
        setMessage(msgEl, 'error', e.message || 'Failed to load reimbursements');
        els.reimbursementsTableBody.innerHTML = '';
        els.approveGrid.innerHTML = '';
    }
}

function renderApproveGrid(reimbursements) {
    els.approveGrid.innerHTML = '';
    const list = Array.isArray(reimbursements) ? reimbursements : [];

    const header = document.createElement('div');
    header.className = 'muted';
    header.textContent = 'Quick actions:';
    els.approveGrid.appendChild(header);

    if (list.length === 0) {
        const p = document.createElement('div');
        p.textContent = 'Nothing to approve.';
        els.approveGrid.appendChild(p);
        return;
    }

    for (const r of list) {
        const card = document.createElement('div');
        card.className = 'approve-card';
        card.innerHTML = `
      <div><strong>#${r.reimbursementId}</strong></div>
      <div class="muted">${escapeHtml(r.title || '')}</div>
      <div class="muted">Status: ${escapeHtml(r.status || '')}</div>
      <div class="approve-actions">
        <button class="btn btn-small" data-action="approve" data-id="${r.reimbursementId}">Approve</button>
        <button class="btn btn-small btn-danger" data-action="reject" data-id="${r.reimbursementId}">Reject</button>
      </div>
    `;
        els.approveGrid.appendChild(card);
    }
}

async function createReimbursement(payload) {
    // backend expects amount as number/string; keep as number-like
    const amount = Number(payload.amount);
    const body = {
        title: payload.title,
        description: payload.description,
        amount: Number.isFinite(amount) ? amount : payload.amount,
    };

    await apiFetch('/rest/reimbursements', { method: 'POST', body });
}

async function actOnReimbursement({ reimbursementId, action }) {
    // backend expects {reimbursementId, action}
    await apiFetch('/rest/reimbursements', {
        method: 'PATCH',
        body: { reimbursementId, action },
    });
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '<')
        .replaceAll('>', '>')
        .replaceAll('"', '"')
        .replaceAll("'", '&#039;');
}

function setActiveTab(tabName) {
    for (const t of els.tabs) {
        t.classList.toggle('active', t.dataset.tab === tabName);
    }
    for (const p of els.panels) {
        p.hidden = p.id !== tabName;
    }
}

function getTabFromClick(target) {
    const tabEl = target.closest('.tab');
    return tabEl?.dataset?.tab;
}

function getUserFromTokenResponse(res) {
    // login controller returns whatever auth.service returns.
    // We'll just keep it generic; if it contains user fields we show them.
    return res?.data?.user || res?.data || null;
}

// Auth events
els.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage(els.authMessage, '', '');

    const payload = formDataToJson(els.loginForm);

    try {
        const res = await login(payload);
        const user = getUserFromTokenResponse(res);
        setAuthedUI({ authed: true, user });
        setMessage(els.authMessage, 'ok', 'Login successful');
        await loadReimbursements();
        setActiveTab('tabList');
    } catch (err) {
        setMessage(els.authMessage, 'error', err.message || 'Login failed');
    }
});

els.registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage(els.authMessage, '', '');

    const payload = formDataToJson(els.registerForm);

    try {
        await register(payload);
        setMessage(els.authMessage, 'ok', 'Registration successful. You can login now.');
    } catch (err) {
        setMessage(els.authMessage, 'error', err.message || 'Registration failed');
    }
});

els.btnLogout.addEventListener('click', async () => {
    setMessage(els.authMessage, '', 'Logging out...');
    try {
        await logout();
    } catch (_) {
        // ignore logout failure
    }

    setAuthedUI({ authed: false, user: null });
    els.reimbursementsTableBody.innerHTML = '';
    els.approveGrid.innerHTML = '';
    setMessage(els.authMessage, 'ok', 'Logged out');
});

els.btnRefresh.addEventListener('click', async () => {
    await loadReimbursements();
});

// Tabs
for (const t of els.tabs) {
    t.addEventListener('click', () => {
        setActiveTab(t.dataset.tab);
    });
}

// Create reimbursement
els.createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage(els.reimbursementsMessage, '', '');

    const payload = formDataToJson(els.createForm);

    try {
        await createReimbursement(payload);
        els.createForm.reset();
        setActiveTab('tabList');
        await loadReimbursements();
    } catch (err) {
        setMessage(els.reimbursementsMessage, 'error', err.message || 'Failed to create');
    }
});

// Load for user
els.btnLoadForUser.addEventListener('click', async () => {
    const userId = (els.targetUserId.value || '').trim();
    await loadReimbursements({ userId: userId || undefined });
});

// Approve/reject click handlers (delegation)
function setupApproveHandlers() {
    els.reimbursementsTableBody.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const reimbursementId = btn.dataset.id;
        const action = btn.dataset.action;

        setMessage(els.approveMessage, '', `Updating #${reimbursementId}...`);
        try {
            await actOnReimbursement({ reimbursementId, action });
            setMessage(els.approveMessage, 'ok', `Updated #${reimbursementId} successfully.`);
            await loadReimbursements();
        } catch (err) {
            setMessage(els.approveMessage, 'error', err.message || 'Action failed');
        }
    });

    els.approveGrid.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const reimbursementId = btn.dataset.id;
        const action = btn.dataset.action;

        setMessage(els.approveMessage, '', `Updating #${reimbursementId}...`);
        try {
            await actOnReimbursement({ reimbursementId, action });
            setMessage(els.approveMessage, 'ok', `Updated #${reimbursementId} successfully.`);
            await loadReimbursements();
        } catch (err) {
            setMessage(els.approveMessage, 'error', err.message || 'Action failed');
        }
    });
}

setupApproveHandlers();

// Initial state
setAuthedUI({ authed: false, user: null });
setActiveTab('tabList');

