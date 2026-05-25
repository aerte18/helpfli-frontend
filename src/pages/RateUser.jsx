import { apiUrl } from "@/lib/apiUrl";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

function RateUser() {
  const { userId } = useParams(); // ID wykonawcy
  const [searchParams] = useSearchParams();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(searchParams.get("orderId") || "");
  const [heading, setHeading] = useState("Oceń wykonawcę");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token || !userId) {
        setLoading(false);
        return;
      }
      if (searchParams.get("orderId")) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(apiUrl(`/api/ratings/eligible?otherUser=${userId}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.eligible && data.orderId) {
          setOrderId(data.orderId);
          setHeading(data.heading || "Oceń wykonawcę");
        } else {
          setError("Możesz ocenić użytkownika dopiero po zakończeniu wspólnego zlecenia.");
        }
      } catch {
        setError("Nie udało się sprawdzić uprawnień do oceny.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!orderId) {
      setError("Brak powiązanego zlecenia — oceń użytkownika ze szczegółów zakończonego zlecenia.");
      return;
    }

    try {
      const res = await fetch(apiUrl("/api/ratings"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ratedUser: userId,
          rating: stars,
          comment,
          orderId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Błąd wystawiania oceny");
      }

      alert("Dziękujemy za ocenę!");
      navigate("/my-orders");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 text-center text-gray-600">
        Sprawdzanie uprawnień…
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow text-black">
      <h2 className="text-xl font-bold mb-4">{heading}</h2>
      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Ocena (1–5):</label>
          <input
            type="number"
            min={1}
            max={5}
            value={stars}
            onChange={(e) => setStars(Number(e.target.value))}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Komentarz (opcjonalnie):</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border rounded p-2"
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={!orderId}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Wyślij ocenę
        </button>
      </form>
    </div>
  );
}

export default RateUser;
