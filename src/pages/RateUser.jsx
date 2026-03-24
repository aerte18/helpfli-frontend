import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function RateUser() {
  const { userId } = useParams(); // ID wykonawcy
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: userId,
          rating: stars,
          comment,
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

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow text-black">
      <h2 className="text-xl font-bold mb-4">Oceń wykonawcę</h2>
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

        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Wyślij ocenę
        </button>
      </form>
    </div>
  );
}

export default RateUser;