import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import { useVehicles } from "../store.jsx";
import { IcFlame } from "../components/Icons.jsx";

export default function Login() {
  const { theme } = useTheme();
  const t = themes[theme];
  const navigate = useNavigate();
  const { login } = useVehicles();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const errorCls = theme === "v1" ? "text-xs text-red-400" : "text-sm text-red-600";

  // Validaciones del formulario antes de llamar a la API.
  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "El correo no tiene un formato válido";
    }
    if (!password) {
      errors.password = "La contraseña es obligatoria";
    } else if (password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Usuario o contraseña incorrectos");
        return;
      }

      login(data); // guarda el usuario en el store (rejemplo en TopNav)
      navigate("/dashboard");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
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
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className={t.label}>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
              }}
              placeholder="correo@ejemplo.cl"
              className={`${t.input} ${fieldErrors.email ? t.inputError : ""}`}
              autoComplete="username"
            />
            {fieldErrors.email && <p className={`${errorCls} mt-1`}>{fieldErrors.email}</p>}
          </div>
          <div>
            <label className={t.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
              }}
              placeholder="Contraseña"
              className={`${t.input} ${fieldErrors.password ? t.inputError : ""}`}
              autoComplete="current-password"
            />
            {fieldErrors.password && <p className={`${errorCls} mt-1`}>{fieldErrors.password}</p>}
          </div>
          {error && <p className={errorCls}>{error}</p>}
          <button type="submit" disabled={loading} className={t.loginBtn}>
            {loading
              ? "Ingresando..."
              : theme === "v1"
              ? "Ingresar al Sistema"
              : "Ingresar"}
          </button>
        </form>
      </div>

        <p className={`${t.loginFooter} mt-6`}>{t.bloginFooterLabel}</p>
      </div>
    </div>
  );
}