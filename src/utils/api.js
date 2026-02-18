export const authedFetch = async (input, init = {}) => {
  const token = localStorage.getItem('adminToken');
  const headers = {
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  const res = await window.fetch(input, { ...init, headers });
  if (res.status === 401) {
    try { await res.clone().text(); } catch {}
    window.alert('Your admin session has expired. Please log in again.');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    window.location.href = '/admin/login';
    throw new Error('SESSION_EXPIRED');
  }
  return res;
};
