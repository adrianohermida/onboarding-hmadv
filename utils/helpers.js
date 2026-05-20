export function formatCurrency(value) {
  return 'R$ ' + Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function formatCPF(value) {
  return value.replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .substring(0, 14);
}

export function formatPhone(value) {
  return value.replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{4})$/, '$1-$2')
    .substring(0, 15);
}

export function truncate(str, len = 60) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function showToast(message, type = 'default') {
  const toast = document.getElementById('toast');
  const msg   = document.getElementById('toast-msg');
  if (!toast || !msg) return;
  msg.textContent = message;
  toast.className = 'toast show' + (type !== 'default' ? ` toast-${type}` : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 4500);
}

export function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}

export function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

export function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
