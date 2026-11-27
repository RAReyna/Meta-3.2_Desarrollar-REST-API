import { Usuario } from "../../models/index.js";

export function buscarPorEmail(email) {
  return Usuario.findOne({ where: { email } });
}

export function buscarPorId(id) {
  return Usuario.findByPk(id);
}

export async function crear({ email, passwordHash, rol }) {
  const usuario = await Usuario.create({ email, password_hash: passwordHash, rol });
  return { id: usuario.id, email: usuario.email, rol: usuario.rol };
}
