// ============================================================
// src/catalogoVehiculos.js
// ============================================================
// Tipos, marcas y modelos de vehículo. La API valida el tipo y la
// marca contra estas listas y el front las carga desde GET /api/config,
// así que se definen una sola vez.
//
// - Tipo y marca: listas CERRADAS. Son pocas y estables, y cerrarlas
//   evita variantes como "Mercedez" o "mercedes benz" que rompen los
//   filtros y la reportería.
// - Modelo: solo SUGERENCIAS según la marca. Los modelos de carros
//   bomba son muy variados (Atego 1726, Midlum 300, Eurocargo 150...)
//   y una lista incompleta impediría registrar un carro real; por eso
//   se acepta cualquier modelo (opcional, máximo 60 caracteres).
//
// Para sumar una marca o un modelo basta con agregarlo acá. Si en el
// futuro el administrador debe gestionarlas desde la app, este archivo
// pasa a ser una tabla y el front no cambia (sigue leyendo /api/config).

export const TIPOS_VEHICULO = [
  "Bomba",
  "Rescate",
  "Escala",
  "Cisterna",
  "Forestal",
  "Materiales peligrosos",
  "Otro",
];

// Marca -> modelos sugeridos (chasis habituales en bomberos de Chile).
export const MARCAS_VEHICULO = {
  "Chevrolet": ["NPR", "NQR", "Silverado"],
  "E-One": ["Cyclone", "Typhoon"],
  "Ford": ["Cargo", "F-350", "F-550", "Ranger"],
  "Freightliner": ["M2 106", "M2 112", "Business Class"],
  "Hino": ["Serie 300", "Serie 500"],
  "International": ["4300", "7400", "MV"],
  "Isuzu": ["NPR", "NQR", "FVR"],
  "Iveco": ["Daily", "Eurocargo", "Tector", "Trakker", "Stralis"],
  "Magirus": ["M32L-AS", "M42L-AS"],
  "MAN": ["TGL", "TGM", "TGS"],
  "Mercedes-Benz": ["Atego", "Axor", "Actros", "Arocs", "Econic", "Sprinter", "Unimog"],
  "Mitsubishi": ["Canter", "L200"],
  "Nissan": ["Cabstar", "Navara"],
  "Pierce": ["Arrow XT", "Enforcer", "Saber"],
  "Renault": ["Midlum", "D Wide", "Kerax", "Premium", "Master"],
  "Scania": ["Serie P", "Serie G", "Serie R"],
  "Spartan": ["Gladiator", "Metro Star"],
  "Toyota": ["Hilux", "Land Cruiser"],
  "Volvo": ["FL", "FE", "FM", "FMX"],
};

export const MODELO_MAX = 60;
