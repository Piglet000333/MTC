export async function getStudents() {
  const res = await fetch("/api/students");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
