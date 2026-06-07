import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const token = data.session.access_token;
    localStorage.setItem("token", token);
    navigate("/dashboard");
  };

  return (
    <div className="login-container">
      <div className="mesh-bg"></div>
      
      <div className="login-card glass animate-fade-in">
        <div className="brand">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="url(#gradient)" />
            <path d="M12 14H28M12 20H20M12 26H24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#bd9dff" />
                <stop offset="1" stopColor="#9492ff" />
              </linearGradient>
            </defs>
          </svg>
          <h1>Note-ly</h1>
          <p className="subtitle">Enterprise Knowledge Hub</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              className="input-field"
              placeholder="name@enterprise.com"
              type="email"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: "1rem" }}>
            {loading ? "Authenticating..." : "Sign In to Workspace"}
          </button>
        </form>

        <div className="footer">
          <p>Don't have an account? <a href="#">Create Workspace</a></p>
          <a href="#" className="forgot-pass">Forgot Password?</a>
        </div>
      </div>

      <style>{`
        .login-container {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .brand {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .brand h1 {
          font-size: 1.75rem;
          color: var(--text-primary);
        }

        .subtitle {
          color: var(--text-secondary);
          font-size: 0.9375rem;
        }

        .footer {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .forgot-pass {
          opacity: 0.7;
          font-size: 0.8125rem;
        }
      `}</style>
    </div>
  );
}