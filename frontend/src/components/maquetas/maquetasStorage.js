
const STORAGE_KEY = "solvex_maquetas";

export const obtenerMaquetas = () => {
  try {
    const datos = localStorage.getItem(STORAGE_KEY);
    return datos ? JSON.parse(datos) : null;
  } catch (error) {
    console.error("Error al obtener las maquetas:", error);
    return null;
  }
};

export const guardarMaquetas = (maquetas) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maquetas));
  } catch (error) {
    console.error("Error al guardar las maquetas:", error);
    throw error;
  }
};