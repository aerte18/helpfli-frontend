import { useEffect, useState } from "react";

function Verification() {
  const [status, setStatus] = useState(null);
  const [emailCode, setEmailCode] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [biz, setBiz] = useState({ businessName: "", taxId: "", address: "", website: "" });

  useEffect(() => {
    fetch("http://localhost:5002/api/verification/status", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        if (data.businessName) setBiz({ businessName: data.businessName, taxId: data.taxId || "", address: data.address || "", website: data.website || "" });
        if (data.phoneNumber) setPhone(data.phoneNumber);
      });
  }, []);

  const sendEmail = async () => {
    const res = await fetch("http://localhost:5002/api/verification/email/send-code", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    if (res.ok) alert("Kod wysłany na email");
  };

  const verifyEmail = async () => {
    const res = await fetch("http://localhost:5002/api/verification/email/verify", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ code: emailCode })
    });
    const data = await res.json();
    if (res.ok) {
      setStatus(data.record);
      setEmailCode("");
      alert("Email zweryfikowany!");
    } else {
      alert(data.message);
    }
  };

  const sendPhone = async () => {
    const res = await fetch("http://localhost:5002/api/verification/phone/send-code", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ phoneNumber: phone })
    });
    if (res.ok) alert("Kod wysłany na telefon");
  };

  const verifyPhone = async () => {
    const res = await fetch("http://localhost:5002/api/verification/phone/verify", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ code: phoneCode })
    });
    const data = await res.json();
    if (res.ok) {
      setStatus(data.record);
      setPhoneCode("");
      alert("Telefon zweryfikowany!");
    } else {
      alert(data.message);
    }
  };

  const saveProfile = async () => {
    const res = await fetch("http://localhost:5002/api/verification/profile", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(biz)
    });
    const data = await res.json();
    if (res.ok) {
      setStatus(data.record);
      alert("Dane firmy zapisane!");
    } else {
      alert(data.message);
    }
  };

  const submitReview = async () => {
    const res = await fetch("http://localhost:5002/api/verification/submit", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    const data = await res.json();
    if (res.ok) {
      setStatus(data.record);
      alert("Przesłano do weryfikacji!");
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6">Weryfikacja wykonawcy</h1>
      
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm">Status:</span>
        <span className={`text-sm font-semibold px-2 py-1 rounded ${
          status?.status === "verified" ? "bg-green-100 text-green-700" :
          status?.status === "pending_review" ? "bg-amber-100 text-amber-700" :
          status?.status === "rejected" ? "bg-red-100 text-red-700" :
          status?.status === "suspended" ? "bg-red-100 text-red-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {status?.status || "unverified"}
        </span>
        {status?.rejectionReason && (
          <span className="text-xs text-red-600">Powód: {status.rejectionReason}</span>
        )}
      </div>

      {/* Krok 1: Email */}
      <div className="mb-6 border rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">1) Weryfikacja e‑mail</h2>
          {status?.emailVerified && <span className="text-green-600 text-sm">✔ Zweryfikowano</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={sendEmail} className="px-3 py-2 bg-indigo-600 text-white rounded">Wyślij kod</button>
          <input className="border rounded p-2 flex-1" placeholder="Kod 6 cyfr" value={emailCode} onChange={e=>setEmailCode(e.target.value)} />
          <button onClick={verifyEmail} className="px-3 py-2 bg-green-600 text-white rounded">Potwierdź</button>
        </div>
      </div>

      {/* Krok 2: Telefon */}
      <div className="mb-6 border rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">2) Weryfikacja telefonu</h2>
          {status?.phoneVerified && <span className="text-green-600 text-sm">✔ Zweryfikowano</span>}
        </div>
        <div className="flex gap-2 mb-2">
          <input className="border rounded p-2 flex-1" placeholder="Telefon (np. +48...)" value={phone} onChange={e=>setPhone(e.target.value)} />
          <button onClick={sendPhone} className="px-3 py-2 bg-indigo-600 text-white rounded">Wyślij kod</button>
        </div>
        <div className="flex gap-2">
          <input className="border rounded p-2 flex-1" placeholder="Kod 6 cyfr" value={phoneCode} onChange={e=>setPhoneCode(e.target.value)} />
          <button onClick={verifyPhone} className="px-3 py-2 bg-green-600 text-white rounded">Potwierdź</button>
        </div>
      </div>

      {/* Krok 3: Firma */}
      <div className="mb-6 border rounded p-4">
        <h2 className="font-semibold mb-3">3) Dane firmy</h2>
        <div className="grid grid-cols-1 gap-3">
          <input className="border rounded p-2" placeholder="Nazwa firmy" value={biz.businessName} onChange={e=>setBiz({...biz, businessName:e.target.value})} />
          <input className="border rounded p-2" placeholder="NIP / REGON" value={biz.taxId} onChange={e=>setBiz({...biz, taxId:e.target.value})} />
          <input className="border rounded p-2" placeholder="Adres" value={biz.address} onChange={e=>setBiz({...biz, address:e.target.value})} />
          <input className="border rounded p-2" placeholder="Strona WWW (opcjonalnie)" value={biz.website} onChange={e=>setBiz({...biz, website:e.target.value})} />
          <button onClick={saveProfile} className="px-3 py-2 bg-gray-800 text-white rounded">Zapisz dane firmy</button>
        </div>
      </div>

      {/* Krok 4: Zgłoszenie do review */}
      <div className="mb-2 border rounded p-4">
        <h2 className="font-semibold mb-3">4) Wyślij do weryfikacji</h2>
        <button 
          onClick={submitReview} 
          disabled={status?.status === "pending_review" || status?.status === "verified"} 
          className={`px-3 py-2 rounded text-white ${ 
            (status?.status === "pending_review" || status?.status === "verified") ? "bg-gray-400" : "bg-emerald-600 hover:bg-emerald-700" 
          }`}
        >
          {status?.status === "pending_review" ? "W oczekiwaniu…" : status?.status === "verified" ? "Zweryfikowano" : "Wyślij"}
        </button>
      </div>
    </div>
  );
}

export default Verification;

























