<template>
  <div class="settings-view">
    <v-container fluid class="pa-8">
      <h1 class="text-h3 font-weight-black text-black mb-8 ls-tight">Configuración</h1>

      <v-row>
        <!-- 1. GESTIÓN DE REPARTICIONES -->
        <v-col cols="12" md="6" lg="5">
          <v-card rounded="xl" border flat class="pa-6 bg-white fill-height d-flex flex-column">
            <div class="d-flex align-center mb-6">
              <v-avatar color="primary" variant="tonal" size="48" class="mr-4">
                <v-icon>mdi-bank-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold lh-1">Reparticiones</div>
                <div class="text-caption text-grey">Unidades de destino configurables.</div>
              </div>
            </div>

            <v-list border rounded="lg" class="flex-grow-1 overflow-y-auto mb-4" max-height="400">
              <v-progress-linear v-if="loadingRep" indeterminate color="primary"></v-progress-linear>
              <v-list-item v-for="rep in reparticiones" :key="rep.id">
                <v-list-item-title class="text-body-2 font-weight-bold">{{ rep.nombre }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ rep.vinculaJerarquia ? `${rep.allowedHierarchyIds?.length || 0} jerarquías vinculadas` : 'Sin restricciones de jerarquía' }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEditRep(rep)"></v-btn>
                  <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="deleteRep(rep.id)"></v-btn>
                </template>
              </v-list-item>
            </v-list>

            <v-btn block color="primary" variant="tonal" rounded="pill" @click="openCreateRep">
              + Nueva Repartición
            </v-btn>
          </v-card>
        </v-col>

        <!-- 2. GESTIÓN DE JERARQUÍAS con Drag & Drop -->
        <v-col cols="12" md="6" lg="4">
          <v-card rounded="xl" border flat class="pa-6 bg-white fill-height d-flex flex-column">
            <div class="d-flex align-center mb-2">
              <v-avatar color="secondary" variant="tonal" size="48" class="mr-4">
                <v-icon>mdi-medal-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold lh-1">Jerarquías</div>
                <div class="text-caption text-grey">Catálogo de rangos disponibles.</div>
              </div>
            </div>

            <div class="text-caption text-grey-lighten-1 mb-3 d-flex align-center ga-1" style="font-size:0.7rem">
              <v-icon size="14" color="grey-lighten-1">mdi-drag</v-icon>
              Arrastrá para reordenar
            </div>

            <div
              class="jer-list border rounded-lg flex-grow-1 overflow-y-auto mb-4"
              style="max-height:400px"
              @dragover.prevent
              @drop.prevent="onDropEnd"
            >
              <v-progress-linear v-if="loadingJer" indeterminate color="secondary"></v-progress-linear>

              <div
                v-for="(jer, index) in jerarquias"
                :key="jer.id"
                class="jer-item d-flex align-center px-4"
                :class="{ 'drag-over': dragOverIndex === index, 'dragging': dragIndex === index }"
                draggable="true"
                @dragstart="onDragStart(index, $event)"
                @dragover.prevent="onDragOver(index)"
                @dragleave="onDragLeave"
                @drop.prevent="onDrop(index)"
                @dragend="onDragEnd"
              >
                <v-icon size="18" color="grey-lighten-1" class="drag-handle mr-3" style="cursor:grab">mdi-drag-vertical</v-icon>
                <span class="text-body-2 font-weight-bold flex-grow-1 py-3">{{ jer.nombre }}</span>
                <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click.stop="deleteJer(jer.id)"></v-btn>
              </div>

              <div v-if="!loadingJer && jerarquias.length === 0" class="text-center text-caption text-grey pa-6">
                Sin jerarquías creadas aún.
              </div>
            </div>

            <v-btn block color="secondary" variant="tonal" rounded="pill" @click="openCreateJer">
              + Añadir Jerarquía
            </v-btn>
          </v-card>
        </v-col>

        <!-- 3. ACCESOS RÁPIDOS -->
        <v-col cols="12" lg="3">
          <v-card rounded="xl" border flat class="pa-6 bg-white mb-4">
            <div class="text-subtitle-2 font-weight-bold text-grey mb-4 text-center">PLANES</div>
            <v-btn block color="amber-darken-3" variant="flat" rounded="pill" to="/billing">Planes y Facturación</v-btn>
          </v-card>
          <v-alert
            type="info"
            variant="tonal"
            rounded="xl"
            class="text-caption"
            title="Dato importante"
          >
            Al vincular jerarquías, el perfil del usuario solo mostrará los rangos seleccionados para esa repartición.
          </v-alert>
        </v-col>
      </v-row>
    </v-container>

    <!-- DIALOGO REPARTICIÓN (FIRESTORE) -->
    <v-dialog v-model="repDialog.show" max-width="600">
      <v-card rounded="xl" class="pa-6">
        <v-card-title class="text-h6 font-weight-bold mb-4">{{ repDialog.isEdit ? 'Editar' : 'Nueva' }} Repartición</v-card-title>
        <v-card-text>
          <v-text-field v-model="repDialog.data.nombre" label="Nombre de la Repartición" variant="outlined" rounded="lg" class="mb-4" />
          
          <v-switch v-model="repDialog.data.vinculaJerarquia" label="Habilitar vinculación de jerarquías" color="primary" class="mb-2" />
          
          <v-select
            v-if="repDialog.data.vinculaJerarquia"
            v-model="repDialog.data.allowedHierarchyIds"
            :items="jerarquias"
            item-title="nombre"
            item-value="id"
            label="Jerarquías Permitidas"
            multiple
            chips
            variant="outlined"
            rounded="lg"
            hint="Solo estos rangos serán visibles para esta repartición"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions class="pt-4">
          <v-spacer />
          <v-btn variant="text" @click="repDialog.show = false">Cancelar</v-btn>
          <v-btn color="primary" rounded="pill" class="px-8 font-weight-bold" @click="saveRep" :loading="saving">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIALOGO JERARQUÍA (FIRESTORE) -->
    <v-dialog v-model="jerDialog.show" max-width="400">
      <v-card rounded="xl" class="pa-6">
        <v-card-title class="text-h6 font-weight-bold mb-4">Nueva Jerarquía</v-card-title>
        <v-card-text>
          <v-text-field v-model="jerDialog.data.nombre" label="Nombre del Rango" variant="outlined" rounded="lg" placeholder="Ej. Oficial Inspector" />
        </v-card-text>
        <v-card-actions class="pt-4">
          <v-spacer />
          <v-btn variant="text" @click="jerDialog.show = false">Cancelar</v-btn>
          <v-btn color="secondary" rounded="pill" class="px-8 font-weight-bold" @click="saveJer" :loading="saving">Crear</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { db } from '../../../plugins/firebase'

const reparticiones = ref<any[]>([])
const jerarquias = ref<any[]>([])
const loadingRep = ref(true)
const loadingJer = ref(true)
const saving = ref(false)
const snackbar = reactive({ show: false, text: '', color: 'success' })

let unsubRep: any = null
let unsubJer: any = null

const showMsg = (text: string, color = 'success') => {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

onMounted(() => {
  // Escuchar Reparticiones
  const qRep = query(collection(db, 'reparticiones'), orderBy('nombre', 'asc'))
  unsubRep = onSnapshot(qRep, (snap) => {
    reparticiones.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    loadingRep.value = false
  })

  // Escuchar Jerarquias — ordenadas por campo 'orden', con fallback a 'nombre'
  const qJer = query(collection(db, 'jerarquias'), orderBy('orden', 'asc'))
  unsubJer = onSnapshot(qJer, (snap) => {
    jerarquias.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    loadingJer.value = false
  }, () => {
    // Fallback si no existe el campo 'orden' todavía
    const qJerFallback = query(collection(db, 'jerarquias'), orderBy('nombre', 'asc'))
    unsubJer = onSnapshot(qJerFallback, (snap) => {
      jerarquias.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      loadingJer.value = false
    })
  })
})

onUnmounted(() => {
  unsubRep && unsubRep()
  unsubJer && unsubJer()
})

// ─── DRAG & DROP ─────────────────────────────────────────────────────────────
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const onDragStart = (index: number, event: DragEvent) => {
  dragIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

const onDragOver = (index: number) => {
  if (dragIndex.value !== null && dragIndex.value !== index) {
    dragOverIndex.value = index
  }
}

const onDragLeave = () => {
  dragOverIndex.value = null
}

const onDrop = (targetIndex: number) => {
  if (dragIndex.value === null || dragIndex.value === targetIndex) return

  const items = [...jerarquias.value]
  const [moved] = items.splice(dragIndex.value, 1)
  items.splice(targetIndex, 0, moved)
  jerarquias.value = items

  dragIndex.value = null
  dragOverIndex.value = null

  // Persistir nuevo orden en Firestore
  persistOrder()
}

const onDropEnd = () => {
  dragIndex.value = null
  dragOverIndex.value = null
}

const onDragEnd = () => {
  dragIndex.value = null
  dragOverIndex.value = null
}

const persistOrder = async () => {
  try {
    const batch = writeBatch(db)
    jerarquias.value.forEach((jer, index) => {
      batch.update(doc(db, 'jerarquias', jer.id), { orden: index })
    })
    await batch.commit()
  } catch (e) {
    console.error('Error guardando orden:', e)
    showMsg('Error al guardar el orden', 'error')
  }
}

// ─── REPARTICIONES ────────────────────────────────────────────────────────────
const repDialog = reactive({ 
  show: false, 
  isEdit: false, 
  data: { id: '', nombre: '', vinculaJerarquia: true, allowedHierarchyIds: [] as string[] } 
})

const openCreateRep = () => {
  repDialog.isEdit = false
  repDialog.data = { id: '', nombre: '', vinculaJerarquia: true, allowedHierarchyIds: [] }
  repDialog.show = true
}

const openEditRep = (rep: any) => {
  repDialog.isEdit = true
  repDialog.data = { ...rep, allowedHierarchyIds: rep.allowedHierarchyIds || [] }
  repDialog.show = true
}

const saveRep = async () => {
  if (!repDialog.data.nombre) return
  saving.value = true
  try {
    const id = repDialog.isEdit ? repDialog.data.id : doc(collection(db, 'reparticiones')).id
    await setDoc(doc(db, 'reparticiones', id), {
      nombre: repDialog.data.nombre,
      vinculaJerarquia: repDialog.data.vinculaJerarquia,
      allowedHierarchyIds: repDialog.data.allowedHierarchyIds
    })
    showMsg('Repartición guardada')
    repDialog.show = false
  } catch (e) { showMsg('Error al guardar', 'error') }
  finally { saving.value = false }
}

const deleteRep = async (id: string) => {
  if (confirm('¿Eliminar repartición?')) {
    await deleteDoc(doc(db, 'reparticiones', id))
    showMsg('Repartición eliminada')
  }
}

// ─── JERARQUIAS ───────────────────────────────────────────────────────────────
const jerDialog = reactive({ show: false, data: { nombre: '' } })

const openCreateJer = () => {
  jerDialog.data = { nombre: '' }
  jerDialog.show = true
}

const saveJer = async () => {
  if (!jerDialog.data.nombre) return
  saving.value = true
  try {
    const id = doc(collection(db, 'jerarquias')).id
    const nextOrden = jerarquias.value.length  // al final de la lista
    await setDoc(doc(db, 'jerarquias', id), { nombre: jerDialog.data.nombre, orden: nextOrden })
    showMsg('Jerarquía creada')
    jerDialog.show = false
  } catch (e) { showMsg('Error al crear', 'error') }
  finally { saving.value = false }
}

const deleteJer = async (id: string) => {
  if (confirm('¿Eliminar jerarquía?')) {
    await deleteDoc(doc(db, 'jerarquias', id))
    showMsg('Jerarquía eliminada')
  }
}
</script>

<style scoped>
.settings-view { min-height: 100vh; background-color: #f8f9fa; }
.ls-tight { letter-spacing: -2px !important; }
.lh-1 { line-height: 1.2; }

/* Drag & Drop */
.jer-list { background: transparent; }
.jer-item {
  border-bottom: 1px solid rgba(0,0,0,0.06);
  transition: background 0.15s, transform 0.1s;
  user-select: none;
}
.jer-item:last-child { border-bottom: none; }
.jer-item:hover { background: rgba(var(--v-theme-secondary), 0.04); }
.jer-item.drag-over {
  background: rgba(var(--v-theme-secondary), 0.12);
  border-top: 2px solid rgb(var(--v-theme-secondary));
  transform: scale(1.01);
}
.jer-item.dragging {
  opacity: 0.4;
}
.drag-handle { cursor: grab !important; }
.drag-handle:active { cursor: grabbing !important; }
</style>
