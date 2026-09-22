import { useState } from "react";
import { themes } from "../themeStyles.js";
import { useTheme } from "../theme.jsx";
import PageHeader from "../components/PageHeader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { IcPlus, IcUsers } from "../components/Icons.jsx";

export default function Users() {
  const { theme } = useTheme();
  const t = themes[theme];

  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("Bombero Voluntario");

  const roles = ["Bombero Voluntario", "Teniente Tercero", "Inspector de Material Mayor", "Administrador"];

  const roleShort = (role) =>
    role === "Inspector de Material Mayor" ? "Insp. Mat. Mayor" : role;

  const initials = (name) =>
    name.split(" ").slice(0, 2).map((n) => n[0]).join("");

  function addUser() {
    if (!newName.trim() || !newEmail.trim()) return;
    setUsers((prev) => [...prev, { id: `u${Date.now()}`, name: newName, email: newEmail, role: newRole }]);
    setNewName("");
    setNewEmail("");
    setShowForm(false);
  }

  return (
    <div>
      <PageHeader title="Gestión de Usuarios" subtitle={`${users.length} usuarios registrados`} />
      <div className="px-4 pb-6 space-y-4 lg:px-8">
        <button onClick={() => setShowForm(!showForm)} className={t.smallBtn}>
          <IcPlus cls="w-4 h-4" />
          Agregar Usuario
        </button>

        {showForm && (
          <div className={t.addForm}>
            <p className={t.formTitle}>Nuevo Usuario</p>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre completo"
              className={t.input}
            />
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="correo@1cbmaipuvoluntario.cl"
              className={t.input}
            />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className={t.input}>
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <div className="flex gap-2 pt-1">
              <button onClick={addUser} className={t.saveUserBtn}>
                Guardar
              </button>
              <button onClick={() => setShowForm(false)} className={t.cancelBtn}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className={`${t.card} overflow-hidden`}>
          {users.length === 0 ? (
            <EmptyState
              icon={<IcUsers cls="w-7 h-7" />}
              title="No hay usuarios registrados"
              subtitle="Usa 'Agregar Usuario' para crear el primero."
            />
          ) : (
            <div className={t.divide}>
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-4">
                  <div className={t.userAvatar}>
                    <span className={t.userAvatarTxt}>{initials(u.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={t.userName}>{u.name}</p>
                    <p className={t.userEmail}>{u.email}</p>
                  </div>
                  <span className={t.roleBadge(u.role)}>{roleShort(u.role)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}