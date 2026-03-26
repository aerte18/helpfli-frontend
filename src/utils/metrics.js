import { apiUrl } from "@/lib/apiUrl";
export const metrics = {
  hit: (providerId, field) => {
    if (!providerId || !field) return;
    return fetch(apiUrl("/api/metrics/hit"), {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId, field })
    }).catch(err => console.log('Metrics hit error:', err));
  },
  
  act: (providerId, field) => {
    if (!providerId || !field) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    
    return fetch(apiUrl("/api/metrics/act"), {
      method: "POST", 
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ providerId, field })
    }).catch(err => console.log('Metrics act error:', err));
  }
};



























