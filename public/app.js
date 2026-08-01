const $ = (id) => document.getElementById(id);

function setStatus(el, message, ok) {
  el.textContent = message;
  el.className = `status ${ok ? 'ok' : 'err'}`;
}

async function api(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function refreshSubscribers() {
  const { subscribers } = await api('/api/subscribers');
  $('sub-count').textContent = subscribers.length;
  const list = $('subscriber-list');
  list.innerHTML = '';
  for (const s of subscribers) {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.innerHTML = `${s.name ? `<strong>${s.name}</strong> ` : ''}<span class="meta">${s.email}</span>`;
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.onclick = async () => {
      await api(`/api/subscribers/${encodeURIComponent(s.email)}`, { method: 'DELETE' });
      refreshSubscribers();
    };
    li.append(label, btn);
    list.appendChild(li);
  }
}

async function refreshIssues() {
  const { issues } = await api('/api/issues');
  $('issue-count').textContent = issues.length;
  const list = $('issue-list');
  list.innerHTML = '';
  for (const issue of [...issues].reverse()) {
    const li = document.createElement('li');
    li.innerHTML = `<span><strong>${issue.subject}</strong><br /><span class="meta">${issue.recipients} recipient(s) · ${new Date(issue.sentAt).toLocaleString()}</span></span>`;
    list.appendChild(li);
  }
}

$('subscribe-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const data = await api('/api/subscribers', {
      method: 'POST',
      body: JSON.stringify({ email: $('sub-email').value, name: $('sub-name').value }),
    });
    setStatus($('subscribe-status'), data.created ? 'Subscriber added!' : 'Already subscribed.', true);
    $('subscribe-form').reset();
    refreshSubscribers();
  } catch (err) {
    setStatus($('subscribe-status'), err.message, false);
  }
});

$('issue-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const data = await api('/api/issues/send', {
      method: 'POST',
      body: JSON.stringify({ subject: $('issue-subject').value, body: $('issue-body').value }),
    });
    setStatus($('issue-status'), `Sent to ${data.issue.recipients} subscriber(s)!`, true);
    $('issue-form').reset();
    refreshIssues();
  } catch (err) {
    setStatus($('issue-status'), err.message, false);
  }
});

refreshSubscribers();
refreshIssues();
