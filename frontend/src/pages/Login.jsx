import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { IcFlame } from "../components/Icons.jsx";

export default function Login() {
  const { theme } = useTheme();
  const t = themes[theme];
  const navigate = useNavigate();

  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user === "admin" && password === "admin12345") {
      setError("");
      navigate("/dashboard");
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className={t.loginOuter}>
      {theme === "v1" && <div className={t.loginGlow} />}
      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className={t.loginLogoBox}>
            <IcFlame cls={t.loginLogoIcon} />
          </div>
          <p className={t.loginBrand1}>Primera Compañía</p>
          {theme === "v1" && (
            <p className={t.loginBrand2}>Cuerpo de Bomberos de Maipú</p>
          )}
          <h1 className={t.loginTitle}>Control de Mantención</h1>
          <p className={t.loginSub}>Vehículos de Emergencia</p>
        </div>

        <div className={`${t.loginCard} space-y-4`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={t.label}>Usuario</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="admin"
              className={t.input}
            />
          </div>
          <div>
            <label className={t.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className={t.input}
            />
          </div>
          {error && (
            <p className={theme === "v1" ? "text-xs text-red-400" : "text-sm text-red-600"}>
              {error}
            </p>
          )}
          <button type="submit" className={t.loginBtn}>
            {theme === "v1" ? "Ingresar al Sistema" : "Ingresar"}
          </button>
        </form>
      </div>

        <p className={`${t.loginFooter} mt-6`}>{t.bloginFooterLabel}</p>
      </div>
    </div>
  );
}