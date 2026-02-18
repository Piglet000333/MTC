export const authedFetch = (input, init = {}) => {
  const token = localStorage.getItem('adminToken');
  const headers = {
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  return window.fetch(input, { ...init, headers });
};
