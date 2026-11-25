import { ref, type Ref } from "vue";
import { textoError } from "@/errores";

// Carga datos del API al crear la página y lleva la cuenta de "cargando" y del error.
// recargar() vuelve a pedirlos, por ejemplo después de guardar un cambio.
export function useRecurso<T>(cargar: () => Promise<T>, inicial: T) {
  const datos = ref(inicial) as Ref<T>;
  const cargando = ref(false);
  const error = ref("");

  async function recargar() {
    cargando.value = true;
    error.value = "";
    try {
      datos.value = await cargar();
    } catch (err) {
      error.value = textoError(err);
    } finally {
      cargando.value = false;
    }
  }

  recargar();
  return { datos, cargando, error, recargar };
}
