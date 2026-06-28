<template>
  <div class="settings-view">
    <v-container fluid class="pa-8">
      <v-row>
        <!-- 1. GESTIÓN DE REPARTICIONES -->
        <v-col cols="12" md="4">
          <v-card rounded="xl" border flat class="bg-white overflow-hidden mb-4">
            <div class="pa-6 d-flex align-center cursor-pointer" @click="showRep = !showRep">
              <v-avatar color="primary" variant="tonal" size="48" class="mr-4">
                <v-icon>mdi-bank-outline</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-h6 font-weight-bold lh-1">Reparticiones</div>
                <div class="text-caption text-grey">Unidades de destino.</div>
              </div>
              <v-btn icon variant="text" :class="{ 'rotate-180': !showRep }">
                <v-icon>mdi-chevron-up</v-icon>
              </v-btn>
            </div>

            <v-expand-transition>
              <div v-show="showRep" class="pa-6 pt-0">
                <v-list border rounded="lg" class="mb-4 overflow-y-auto" max-height="300">
                  <v-progress-linear v-if="loadingRep" indeterminate color="primary"></v-progress-linear>
                  <v-list-item v-for="rep in reparticiones" :key="rep.id">
                    <v-list-item-title class="text-body-2 font-weight-bold">{{ rep.nombre }}</v-list-item-title>
                    <template v-slot:append>
                      <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEditRep(rep)"></v-btn>
                      <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="deleteRep(rep.id)"></v-btn>
                    </template>
                  </v-list-item>
                </v-list>
                <v-btn block color="primary" variant="tonal" rounded="pill" @click="openCreateRep">+ Nueva Repartición</v-btn>
              </div>
            </v-expand-transition>
          </v-card>
        </v-col>

        <!-- 2. GESTIÓN DE JERARQUÍAS -->
        <v-col cols="12" md="4">
          <v-card rounded="xl" border flat class="bg-white overflow-hidden mb-4">
            <div class="pa-6 d-flex align-center cursor-pointer" @click="showJer = !showJer">
              <v-avatar color="secondary" variant="tonal" size="48" class="mr-4">
                <v-icon>mdi-medal-outline</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-h6 font-weight-bold lh-1">Jerarquías</div>
                <div class="text-caption text-grey">Catálogo de rangos.</div>
              </div>
              <v-btn icon variant="text" :class="{ 'rotate-180': !showJer }">
                <v-icon>mdi-chevron-up</v-icon>
              </v-btn>
            </div>

            <v-expand-transition>
              <div v-show="showJer" class="pa-6 pt-0">
                <div class="jer-list border rounded-lg overflow-y-auto mb-4" style="max-height:300px" @dragover.prevent @drop.prevent="onDropEnd">
                  <v-progress-linear v-if="loadingJer" indeterminate color="secondary"></v-progress-linear>
                  <div
                    v-for="(jer, index) in jerarquias"
                    :key="jer.id"
                    class="jer-item d-flex align-center px-4"
                    :class="{ 'dragging': dragIndex === index }"
                    draggable="true"
                    @dragstart="onDragStart(index)"
                    @dragover.prevent="onDragOver(index)"
                    @drop.prevent="onDrop(index)"
                  >
                    <v-icon size="18" color="grey-lighten-1" class="drag-handle mr-3">mdi-drag-vertical</v-icon>
                    <span class="text-body-2 font-weight-bold flex-grow-1 py-3">{{ jer.nombre }}</span>
                    <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click.stop="deleteJer(jer.id)"></v-btn>
                  </div>
                </div>
                <v-btn block color="secondary" variant="tonal" rounded="pill" @click="openCreateJer">+ Añadir Jerarquía</v-btn>
              </div>
            </v-expand-transition>
          </v-card>
        </v-col>

        <!-- 3. GESTIÓN DE SUSCRIPCIONES -->
        <v-col cols="12" md="4">
          <v-card rounded="xl" border flat class="bg-white overflow-hidden mb-4">
            <div class="pa-6 d-flex align-center cursor-pointer" @click="showSub = !showSub">
              <v-avatar color="amber-darken-3" variant="tonal" size="48" class="mr-4">
                <v-icon>mdi-star-circle-outline</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-h6 font-weight-bold lh-1">Suscripciones</div>
                <div class="text-caption text-grey">Planes y Beneficios.</div>
              </div>
              <v-btn icon variant="text" :class="{ 'rotate-180': !showSub }">
                <v-icon>mdi-chevron-up</v-icon>
              </v-btn>
            </div>

            <v-expand-transition>
              <div v-show="showSub" class="pa-6 pt-0">
                <v-list border rounded="lg" class="mb-4 overflow-y-auto" max-height="300">
                  <v-progress-linear v-if="loadingSub" indeterminate color="amber-darken-3"></v-progress-linear>
                  <v-list-item v-for="sub in subscriptions" :key="sub.id" :active="sub.visible">
                    <template v-slot:prepend>
                      <v-icon :color="sub.visible ? 'amber-darken-3' : 'grey'">{{ sub.visible ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2 font-weight-bold">
                      {{ sub.title }} - ${{ sub.price }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      {{ sub.isDynamic ? 'Dinámico por personas' : sub.period }}
                    </v-list-item-subtitle>
                    <template v-slot:append>
                      <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEditSub(sub)"></v-btn>
                      <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="deleteSub(sub.id)"></v-btn>
                    </template>
                  </v-list-item>
                </v-list>
                <v-btn block color="amber-darken-3" variant="tonal" rounded="pill" @click="openCreateSub">+ Nueva Suscripción</v-btn>
              </div>
            </v-expand-transition>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- DIALOGO SUSCRIPCIÓN -->
    <v-dialog v-model="subDialog.show" max-width="700" persistent>
      <v-card rounded="xl" class="pa-6">
        <v-card-title class="text-h6 font-weight-bold mb-4">Configurar Plan de Suscripción</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="8">
              <v-text-field v-model="subDialog.data.title" label="Título del Plan" variant="outlined" rounded="lg" class="mb-2" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="subDialog.data.category" :items="['Designador', 'Asignado', 'Ambos']" label="Tipo de Plan" variant="outlined" rounded="lg" />
            </v-col>
            <v-col cols="12" md="6">
              <v-switch v-model="subDialog.data.visible" label="Visible en Web" color="amber-darken-3" density="compact" />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field v-model.number="subDialog.data.price" label="Precio Base ($)" type="number" variant="outlined" rounded="lg" class="mb-2" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="subDialog.data.period" :items="['Mensual', 'Anual']" label="Periodo Facturación" variant="outlined" rounded="lg" />
            </v-col>

            <v-col cols="12">
              <v-switch v-model="subDialog.data.isDynamic" label="Habilitar multiplicador por personas" color="secondary" />
              <div v-if="subDialog.data.isDynamic" class="bg-grey-lighten-4 pa-4 rounded-lg text-caption mb-4">
                Este plan permitirá aumentar o disminuir la cantidad de usuarios, multiplicando el precio base.
              </div>
            </v-col>

            <v-col cols="12">
              <div class="text-caption font-weight-bold mb-2">Ítems de Beneficio (uno por línea)</div>
              <v-textarea v-model="subDialog.data.itemsText" variant="outlined" rounded="lg" rows="4" placeholder="Ej: Soporte 24/7\nAcceso total\nReportes premium" />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field v-model="subDialog.data.buttonLabel" label="Texto del Botón Final" variant="outlined" rounded="lg" placeholder="Ej: Comprar ahora" :disabled="!subDialog.data.showButton" />
            </v-col>
            <v-col cols="12" md="6">
              <v-switch v-model="subDialog.data.showButton" label="Mostrar Botón de Acción" color="primary" density="compact" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pt-4">
          <v-spacer />
          <v-btn variant="text" @click="subDialog.show = false">Cancelar</v-btn>
          <v-btn color="amber-darken-3" rounded="pill" class="px-8 font-weight-bold" @click="saveSub" :loading="saving">Guardar Plan</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIALOGOS REPARTICION Y JERARQUIA (EXISTENTES) -->
    <v-dialog v-model="repDialog.show" max-width="600">
      <v-card rounded="xl" class="pa-6">
        <v-card-title class="text-h6 font-weight-bold mb-4">{{ repDialog.isEdit ? 'Editar' : 'Nueva' }} Repartición</v-card-title>
        <v-card-text>
          <v-text-field v-model="repDialog.data.nombre" label="Nombre" variant="outlined" rounded="lg" class="mb-4" />
          <v-switch v-model="repDialog.data.vinculaJerarquia" label="Vincular Jerarquías" color="primary" />
          <v-select v-if="repDialog.data.vinculaJerarquia" v-model="repDialog.data.allowedHierarchyIds" :items="jerarquias" item-title="nombre" item-value="id" label="Permitidas" multiple chips variant="outlined" rounded="lg" />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="repDialog.show = false">Cancelar</v-btn><v-btn color="primary" rounded="pill" @click="saveRep" :loading="saving">Guardar</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="jerDialog.show" max-width="400">
      <v-card rounded="xl" class="pa-6">
        <v-card-title class="text-h6 font-weight-bold mb-4">Nueva Jerarquía</v-card-title>
        <v-card-text><v-text-field v-model="jerDialog.data.nombre" label="Nombre" variant="outlined" rounded="lg" /></v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="jerDialog.show = false">Cancelar</v-btn><v-btn color="secondary" rounded="pill" @click="saveJer" :loading="saving">Crear</v-btn></v-card-actions>
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
const subscriptions = ref<any[]>([])
const loadingRep = ref(true)
const loadingJer = ref(true)
const loadingSub = ref(true)
const saving = ref(false)
const snackbar = reactive({ show: false, text: '', color: 'success' })

const showRep = ref(true); const showJer = ref(true); const showSub = ref(true)

let unsubRep: any = null; let unsubJer: any = null; let unsubSub: any = null

const showMsg = (text: string, color = 'success') => { snackbar.text = text; snackbar.color = color; snackbar.show = true }

onMounted(() => {
  unsubRep = onSnapshot(query(collection(db, 'reparticiones'), orderBy('nombre', 'asc')), (snap) => {
    reparticiones.value = snap.docs.map(d => ({ id: d.id, ...d.data() })); loadingRep.value = false
  })
  unsubJer = onSnapshot(query(collection(db, 'jerarquias'), orderBy('orden', 'asc')), (snap) => {
    jerarquias.value = snap.docs.map(d => ({ id: d.id, ...d.data() })); loadingJer.value = false
  }, () => {
    unsubJer = onSnapshot(query(collection(db, 'jerarquias'), orderBy('nombre', 'asc')), (snap) => {
      jerarquias.value = snap.docs.map(d => ({ id: d.id, ...d.data() })); loadingJer.value = false
    })
  })
  // Escuchar Suscripciones
  unsubSub = onSnapshot(query(collection(db, 'subscriptions'), orderBy('price', 'asc')), (snap) => {
    subscriptions.value = snap.docs.map(d => ({ id: d.id, ...d.data() })); loadingSub.value = false
  })
})

onUnmounted(() => { unsubRep?.(); unsubJer?.(); unsubSub?.() })

// DRAG & DROP JERARQUIAS
const dragIndex = ref<number | null>(null); const dragOverIndex = ref<number | null>(null)
const onDragStart = (index: number) => { dragIndex.value = index }
const onDragOver = (index: number) => { if (dragIndex.value !== null && dragIndex.value !== index) dragOverIndex.value = index }
const onDrop = (targetIndex: number) => {
  if (dragIndex.value === null || dragIndex.value === targetIndex) return
  const items = [...jerarquias.value]; const [moved] = items.splice(dragIndex.value, 1); items.splice(targetIndex, 0, moved)
  jerarquias.value = items; dragIndex.value = null; dragOverIndex.value = null; persistOrder()
}
const onDropEnd = () => { dragIndex.value = null; dragOverIndex.value = null }
const persistOrder = async () => {
  try {
    const batch = writeBatch(db); jerarquias.value.forEach((jer, i) => batch.update(doc(db, 'jerarquias', jer.id), { orden: i }))
    await batch.commit()
  } catch (e) { showMsg('Error al guardar orden', 'error') }
}

// SCRIPTS REPARTICION
const repDialog = reactive({ show: false, isEdit: false, data: { id: '', nombre: '', vinculaJerarquia: true, allowedHierarchyIds: [] as string[] } })
const openCreateRep = () => { repDialog.isEdit = false; repDialog.data = { id: '', nombre: '', vinculaJerarquia: true, allowedHierarchyIds: [] }; repDialog.show = true }
const openEditRep = (rep: any) => { repDialog.isEdit = true; repDialog.data = { ...rep }; repDialog.show = true }
const saveRep = async () => {
  if (!repDialog.data.nombre) return; saving.value = true
  try {
    const id = repDialog.isEdit ? repDialog.data.id : doc(collection(db, 'reparticiones')).id
    await setDoc(doc(db, 'reparticiones', id), { ...repDialog.data }); showMsg('Guardado'); repDialog.show = false
  } finally { saving.value = false }
}
const deleteRep = async (id: string) => { if (confirm('¿Eliminar?')) await deleteDoc(doc(db, 'reparticiones', id)) }

// SCRIPTS JERARQUIA
const jerDialog = reactive({ show: false, data: { nombre: '' } })
const openCreateJer = () => { jerDialog.data = { nombre: '' }; jerDialog.show = true }
const saveJer = async () => {
  if (!jerDialog.data.nombre) return; saving.value = true
  try {
    const id = doc(collection(db, 'jerarquias')).id; await setDoc(doc(db, 'jerarquias', id), { nombre: jerDialog.data.nombre, orden: jerarquias.value.length })
    showMsg('Creada'); jerDialog.show = false
  } finally { saving.value = false }
}
const deleteJer = async (id: string) => { if (confirm('¿Eliminar?')) await deleteDoc(doc(db, 'jerarquias', id)) }

// SCRIPTS SUSCRIPCIÓN
const subDialog = reactive({ 
  show: false, 
  isEdit: false, 
  data: { id: '', title: '', price: 0, period: 'Mensual', isDynamic: false, itemsText: '', buttonLabel: 'Suscribirse', visible: true, category: 'Designador', showButton: true } 
})
const openCreateSub = () => {
  subDialog.isEdit = false
  subDialog.data = { id: '', title: '', price: 0, period: 'Mensual', isDynamic: false, itemsText: '', buttonLabel: 'Suscribirse', visible: true, category: 'Designador', showButton: true }
  subDialog.show = true
}
const openEditSub = (sub: any) => {
  subDialog.isEdit = true
  subDialog.data = { ...sub, itemsText: (sub.items || []).join('\n') }
  subDialog.show = true
}
const saveSub = async () => {
  if (!subDialog.data.title) return; saving.value = true
  try {
    const id = subDialog.isEdit ? subDialog.data.id : doc(collection(db, 'subscriptions')).id
    const items = subDialog.data.itemsText.split('\n').filter(l => l.trim() !== '')
    await setDoc(doc(db, 'subscriptions', id), {
      title: subDialog.data.title,
      price: subDialog.data.price,
      period: subDialog.data.period,
      isDynamic: subDialog.data.isDynamic,
      items: items,
      buttonLabel: subDialog.data.buttonLabel,
      visible: subDialog.data.visible,
      category: subDialog.data.category || 'Designador',
      showButton: subDialog.data.showButton ?? true,
      updatedAt: new Date()
    })
    showMsg('Suscripción guardada')
    subDialog.show = false
  } catch (e) { showMsg('Error al guardar plan', 'error') }
  finally { saving.value = false }
}
const deleteSub = async (id: string) => { if (confirm('¿Eliminar plan?')) await deleteDoc(doc(db, 'subscriptions', id)) }

</script>

<style scoped>
.settings-view { min-height: 100vh; background-color: #f8f9fa; }
.ls-tight { letter-spacing: -2px !important; }
.lh-1 { line-height: 1.2; }
.rotate-180 { transform: rotate(180deg); }
.cursor-pointer { cursor: pointer; }
.jer-item { border-bottom: 1px solid rgba(0,0,0,0.06); transition: all 0.2s; user-select: none; }
.jer-item:last-child { border-bottom: none; }
.jer-item.dragging { opacity: 0.4; }
.drag-handle { cursor: grab !important; }
</style>
