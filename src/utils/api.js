import toast from 'react-hot-toast';
export const authedFetch = async (input, init = {}) => {
  const token = localStorage.getItem('adminToken');
  const headers = {
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  const res = await window.fetch(input, { ...init, headers });
  if (res.status === 401) {
    try { await res.clone().text(); } catch {}
    toast.error('Your admin session expired.');
    window.dispatchEvent(new CustomEvent('adminSessionExpired'));
    throw new Error('SESSION_EXPIRED');
  }
  return res;
};
