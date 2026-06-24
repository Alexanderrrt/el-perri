"use client";
import { useState, useEffect } from "react";

export default function WelcomeBubble() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [formData, setFormData] = useState({ email: "", name: "" });
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const visited = localStorage.getItem("elPerriVisited");
    if (!visited) {
      setTimeout(() => setShowWelcome(true), 2000);
      localStorage.setItem("elPerriVisited", "true");
    }
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      alert("Please enter your email");
      return;
    }

    try {
      const response = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubscribed(true);
        setTimeout(() => setShowWelcome(false), 2000);
      }
    } catch (error) {
      console.error("Subscription error:", error);
    }
  };

  if (!showWelcome) return null;

  return (
    <div className="welcome-overlay">
      <div className="welcome-bubble">
        <button className="close-btn" onClick={() => setShowWelcome(false)}>✕</button>

        {!subscribed ? (
          <div className="welcome-content">
            <div className="welcome-icon">🌮</div>
            <h2>Welcome to El Perri!</h2>
            <p>Experience authentic Latin cuisine at its finest.</p>

            <form onSubmit={handleSubscribe} className="subscribe-form">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                type="email"
                placeholder="Your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <button type="submit" className="btn-subscribe">Get Updates & Offers</button>
            </form>

            <button className="btn-skip" onClick={() => setShowWelcome(false)}>
              Skip for now
            </button>
          </div>
        ) : (
          <div className="welcome-success">
            <div className="success-icon">✓</div>
            <h2>Thank You!</h2>
            <p>You're all set. Enjoy your visit!</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .welcome-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .welcome-bubble {
          background: #fff;
          border-radius: 16px;
          padding: 3rem 2rem;
          max-width: 420px;
          width: 90%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          position: relative;
          animation: bubbleIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes bubbleIn {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #000;
        }

        .welcome-icon {
          font-size: 3rem;
          text-align: center;
          margin-bottom: 1rem;
        }

        .welcome-content h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.8rem;
          color: #000;
          text-align: center;
        }

        .welcome-content > p {
          text-align: center;
          color: #666;
          margin: 0 0 1.5rem 0;
          font-size: 0.95rem;
        }

        .subscribe-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .subscribe-form input {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .subscribe-form input:focus {
          outline: none;
          border-color: #ffd700;
          box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
        }

        .btn-subscribe {
          padding: 0.875rem;
          background: #ffd700;
          color: #000;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .btn-subscribe:hover {
          background: #ffed4e;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
        }

        .btn-skip {
          width: 100%;
          padding: 0.75rem;
          background: transparent;
          color: #666;
          border: 1px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-skip:hover {
          color: #000;
          border-color: #000;
        }

        .welcome-success {
          text-align: center;
        }

        .success-icon {
          font-size: 3rem;
          color: #4caf50;
          margin-bottom: 1rem;
        }

        .welcome-success h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.6rem;
          color: #000;
        }

        .welcome-success p {
          color: #666;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
