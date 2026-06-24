"use client";
import { useState, useEffect } from "react";
import { signupUser, loginUser } from "@/lib/userStore";

export default function WelcomeBubble() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [mode, setMode] = useState("menu"); // 'menu' | 'signup' | 'login'
  const [signupData, setSignupData] = useState({ email: "", password: "", name: "" });
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userAuth = sessionStorage.getItem("userAuth");
    if (userAuth) {
      setShowWelcome(false);
    }
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    if (!signupData.email || !signupData.password) {
      setMessage("Email and password required");
      setIsLoading(false);
      return;
    }

    try {
      const user = await signupUser(signupData);
      sessionStorage.setItem("userAuth", JSON.stringify(user));
      setMessage("✓ Account created! Welcome!");
      setTimeout(() => setShowWelcome(false), 2000);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    if (!loginData.email || !loginData.password) {
      setMessage("Email and password required");
      setIsLoading(false);
      return;
    }

    try {
      const user = await loginUser(loginData);
      sessionStorage.setItem("userAuth", JSON.stringify(user));
      setMessage("✓ Logged in successfully!");
      setTimeout(() => setShowWelcome(false), 2000);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showWelcome) return null;

  return (
    <div className="welcome-overlay">
      <div className="welcome-bubble">
        <button className="close-btn" onClick={() => setShowWelcome(false)}>✕</button>

        {mode === "menu" && (
          <div className="welcome-content">
            <div className="welcome-icon">🌮</div>
            <h2>Welcome to El Perri!</h2>
            <p>Experience authentic Latin cuisine at its finest.</p>

            <div className="welcome-buttons">
              <button
                className="btn-mode"
                onClick={() => setMode("signup")}
                style={{ background: "#ffd700", color: "#000" }}
              >
                Create Account
              </button>
              <button
                className="btn-mode"
                onClick={() => setMode("login")}
                style={{ background: "transparent", color: "#000", border: "2px solid #000" }}
              >
                Sign In
              </button>
            </div>

            <button className="btn-skip" onClick={() => setShowWelcome(false)}>
              Skip for now
            </button>
          </div>
        )}

        {mode === "signup" && (
          <div className="welcome-content">
            <h2>Create Account</h2>
            <p>Join El Perri and get exclusive offers!</p>

            {message && <div className={message.includes("✓") ? "form-success" : "form-error"}>{message}</div>}

            <form onSubmit={handleSignup} className="subscribe-form">
              <input
                type="text"
                placeholder="Your name"
                value={signupData.name}
                onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                disabled={isLoading}
              />
              <input
                type="email"
                placeholder="Email address"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                required
                disabled={isLoading}
              />
              <input
                type="password"
                placeholder="Password"
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                required
                disabled={isLoading}
              />
              <button type="submit" className="btn-subscribe" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Account"}
              </button>
            </form>

            <button className="btn-back" onClick={() => setMode("menu")}>← Back</button>
          </div>
        )}

        {mode === "login" && (
          <div className="welcome-content">
            <h2>Sign In</h2>
            <p>Welcome back!</p>

            {message && <div className={message.includes("✓") ? "form-success" : "form-error"}>{message}</div>}

            <form onSubmit={handleLogin} className="subscribe-form">
              <input
                type="email"
                placeholder="Email address"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
                disabled={isLoading}
              />
              <input
                type="password"
                placeholder="Password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
                disabled={isLoading}
              />
              <button type="submit" className="btn-subscribe" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <button className="btn-back" onClick={() => setMode("menu")}>← Back</button>
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

        .welcome-buttons {
          display: flex;
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .btn-mode {
          flex: 1;
          padding: 0.875rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .btn-mode:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .btn-back {
          width: 100%;
          padding: 0.75rem;
          background: transparent;
          color: #666;
          border: 1px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          margin-top: 1rem;
          transition: all 0.2s;
        }

        .btn-back:hover {
          color: #000;
          border-color: #000;
        }

        .form-error {
          background: #ffebee;
          color: #c62828;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .form-success {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
