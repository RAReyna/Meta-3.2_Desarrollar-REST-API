// Llena la base de datos con jugadores y rosters de ejemplo.
// Se puede correr varias veces: lo que ya existe no se duplica.
import "dotenv/config";
import { sequelize, Jugador, Roster, RosterJugador } from "../models/index.js";

// [nickname, nombre real, país, rol, estado]
const JUGADORES = [
  // T1
  ["Zeus", "Choi Woo-je", "Corea del Sur", "Top", "activo"],
  ["Oner", "Mun Hyeon-jun", "Corea del Sur", "Jungle", "activo"],
  ["Faker", "Lee Sang-hyeok", "Corea del Sur", "Mid", "activo"],
  ["Gumayusi", "Lee Min-hyeong", "Corea del Sur", "ADC", "activo"],
  ["Keria", "Ryu Min-seok", "Corea del Sur", "Support", "activo"],
  // Gen.G
  ["Kiin", "Kim Gi-in", "Corea del Sur", "Top", "activo"],
  ["Canyon", "Kim Geon-bu", "Corea del Sur", "Jungle", "activo"],
  ["Chovy", "Jeong Ji-hoon", "Corea del Sur", "Mid", "activo"],
  ["Peyz", "Kim Su-hwan", "Corea del Sur", "ADC", "activo"],
  ["Lehends", "Son Si-woo", "Corea del Sur", "Support", "activo"],
  // G2
  ["BrokenBlade", "Sergen Çelik", "Alemania", "Top", "activo"],
  ["Yike", "Martin Sundelin", "Suecia", "Jungle", "activo"],
  ["Caps", "Rasmus Winther", "Dinamarca", "Mid", "activo"],
  ["Hans Sama", "Steven Liv", "Francia", "ADC", "activo"],
  ["Mikyx", "Mihael Mehle", "Eslovenia", "Support", "activo"],
  // Academy y suplentes
  ["Rascal", "Kim Kwang-hee", "Corea del Sur", "Top", "activo"],
  ["Peanut", "Han Wang-ho", "Corea del Sur", "Jungle", "activo"],
  ["Poby", "Yoon Sung-won", "Corea del Sur", "Mid", "activo"],
  ["Smash", "Shin Geum-jae", "Corea del Sur", "ADC", "activo"],
  ["Effort", "Lee Sang-ho", "Corea del Sur", "Support", "activo"],
  ["Jensen", "Nicolaj Jensen", "Dinamarca", "Mid", "activo"],
  // Sin roster
  ["Doublelift", "Yiliang Peng", "Estados Unidos", "ADC", "inactivo"],
  ["Uzi", "Jian Zi-Hao", "China", "ADC", "inactivo"],
  ["Rookie", "Song Eui-jin", "Corea del Sur", "Mid", "inactivo"],
];

// Cada roster: titulares (uno por rol) y suplentes.
const ROSTERS = [
  {
    nombre: "T1",
    tipo: "Principal",
    temporada: "2026",
    titulares: ["Zeus", "Oner", "Faker", "Gumayusi", "Keria"],
    suplentes: ["Poby"],
  },
  {
    nombre: "Gen.G",
    tipo: "Principal",
    temporada: "2026",
    titulares: ["Kiin", "Canyon", "Chovy", "Peyz", "Lehends"],
    suplentes: [],
  },
  {
    nombre: "G2 Esports",
    tipo: "Principal",
    temporada: "2026",
    titulares: ["BrokenBlade", "Yike", "Caps", "Hans Sama", "Mikyx"],
    suplentes: ["Jensen"],
  },
  {
    nombre: "T1 Academy",
    tipo: "Academy",
    temporada: "2026",
    titulares: ["Rascal", "Peanut", "Poby", "Smash", "Effort"],
    suplentes: [],
  },
  {
    nombre: "Gen.G Academy",
    tipo: "Academy",
    temporada: "2026",
    titulares: ["Rascal", "Effort"],
    suplentes: ["Jensen"],
  },
];

await sequelize.transaction(async (t) => {
  // Jugadores: ignoreDuplicates (INSERT IGNORE) salta los nicknames que ya existen.
  await Jugador.bulkCreate(
    JUGADORES.map(([nickname, nombre_real, pais, rol, estado]) => ({
      nickname,
      nombre_real,
      pais,
      rol,
      estado,
    })),
    { ignoreDuplicates: true, transaction: t },
  );
  const jugadores = await Jugador.findAll({ attributes: ["id", "nickname"], transaction: t });
  const idDe = Object.fromEntries(jugadores.map((j) => [j.nickname, j.id]));

  for (const roster of ROSTERS) {
    // Rosters: se identifican por nombre + temporada.
    const [{ id: idRoster }] = await Roster.findOrCreate({
      where: { nombre: roster.nombre, temporada: roster.temporada },
      defaults: { tipo: roster.tipo },
      transaction: t,
    });

    // Asignaciones: el índice único (id_roster, id_jugador) evita repetirlas.
    const asignaciones = [
      ...roster.titulares.map((nickname) => [nickname, "Titular"]),
      ...roster.suplentes.map((nickname) => [nickname, "Suplente"]),
    ];
    for (const [nickname] of asignaciones) {
      if (!idDe[nickname]) throw new Error(`Jugador desconocido: ${nickname}`);
    }
    await RosterJugador.bulkCreate(
      asignaciones.map(([nickname, rol_en_roster]) => ({
        id_roster: idRoster,
        id_jugador: idDe[nickname],
        rol_en_roster,
      })),
      { ignoreDuplicates: true, transaction: t },
    );
  }
});

const jugadores = await Jugador.count();
const rosters = await Roster.count();
console.log(`Datos de ejemplo listos. En la base: ${jugadores} jugadores, ${rosters} rosters.`);
await sequelize.close();
