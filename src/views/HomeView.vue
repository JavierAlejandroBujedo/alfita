<template>
  <div class="home-view pa-4 pa-md-8">
    <div class="max-width-container mx-auto">
      
      <!-- CABECERA DE ACCIONES RÁPIDAS -->
      <header class="d-flex flex-column flex-md-row justify-end align-start align-md-center mb-8 ga-3">
        <v-btn
          color="success"
          variant="tonal"
          prepend-icon="mdi-account-clock"
          rounded="pill"
          class="font-weight-bold px-6"
        >
          Ver disponibilidad del personal
        </v-btn>

        <v-btn
          color="secondary"
          variant="tonal"
          prepend-icon="mdi-email-send"
          rounded="pill"
          class="font-weight-bold px-6"
          @click="availabilityModal = true"
        >
          Solicitar Disponibilidad
        </v-btn>

        <v-btn
          color="primary"
          prepend-icon="mdi-file-plus"
          rounded="pill"
          class="px-8 font-weight-bold elevation-4 shadow-primary"
          @click="openCreateModal"
        >
          Crear Hoja de Servicio
        </v-btn>
      </header>

      <!-- SECCIÓN DE HOJAS DE SERVICIO (MIS HOJAS) -->
      <div class="mb-12">
        <div class="d-flex align-center mb-4">
          <v-icon color="primary" class="mr-2">mdi-file-document-multiple</v-icon>
          <h2 class="text-h5 font-weight-black">Mis Hojas de Servicio</h2>
          <v-spacer></v-spacer>
          <v-chip v-if="sheets.length > 0" size="small" variant="tonal" color="primary" class="font-weight-bold">
            {{ sheets.length }} TOTALES
          </v-chip>
        </div>

        <v-row v-if="loadingSheets">
          <v-col v-for="n in 2" :key="n" cols="12" md="6">
            <v-skeleton-loader type="article" border class="rounded-xl"></v-skeleton-loader>
          </v-col>
        </v-row>

        <v-row v-else-if="sheets.length > 0">
          <v-col v-for="sheet in sheets" :key="sheet.id" cols="12" md="6">
            <v-card rounded="xl" border flat class="pa-4 bg-white hover-elevate-soft" @click="openSheetDetails(sheet)">
              <div class="d-flex justify-space-between align-start mb-2">
                <div>
                  <div class="text-overline font-weight-black text-primary line-height-1">COBERTURA {{ sheet.month }} {{ sheet.year }}</div>
                  <h3 class="text-h6 font-weight-black">{{ sheet.description || 'Sin descripción' }}</h3>
                </div>
                <div class="d-flex align-center">
                  <v-chip :color="getStatusColor(sheet.status)" size="small" variant="flat" class="font-weight-bold px-3 mr-2">
                    {{ sheet.status === 'pending' ? 'PENDIENTE' : 'AUDITADO' }}
                  </v-chip>
                  
                  <v-btn
                    v-if="sheet.status === 'pending'"
                    size="x-small"
                    variant="tonal"
                    color="secondary"
                    class="font-weight-bold mr-2"
                    prepend-icon="mdi-auto-fix"
                    @click.stop="handleAutocomplete(sheet)"
                  >
                    AUTOCOMPLETAR
                  </v-btn>
                  
                  <template v-if="sheet.status === 'pending'">
                    <v-btn icon="mdi-pencil" size="x-small" variant="tonal" color="primary" class="mr-1" @click.stop="openEditModal(sheet)"></v-btn>
                    <v-btn icon="mdi-delete" size="x-small" variant="tonal" color="error" @click.stop="askDelete(sheet)"></v-btn>
                  </template>
                </div>
              </div>

              <div class="d-flex ga-2 mt-2 mb-2">
                <v-btn 
                  v-for="idx in [0, 1, 2]" 
                  :key="idx"
                  @click.stop="openShiftModal(sheet, idx)"
                  variant="flat" 
                  color="success" 
                  size="x-small" 
                  rounded="pill"
                  class="flex-grow-1 font-weight-bold"
                >
                  <v-icon start size="14" v-if="!sheet.shifts?.[idx]">mdi-clock-plus</v-icon>
                  <span v-else class="text-caption">{{ sheet.shifts[idx].start }} - {{ sheet.shifts[idx].end }}</span>
                  <span v-if="!sheet.shifts?.[idx]" class="text-caption">+ HORARIO</span>
                </v-btn>
              </div>
              
              <v-divider class="my-2"></v-divider>
              
              <div class="d-flex align-center justify-space-between">
                <div class="text-caption text-grey">
                  <v-icon size="14" class="mr-1">mdi-calendar-edit</v-icon>
                  {{ formatDate(sheet.createdAt) }}
                </div>
                <v-btn variant="text" size="small" color="primary" class="font-weight-bold text-none">
                  Ver Planilla <v-icon class="ml-1">mdi-arrow-right</v-icon>
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-card v-else rounded="xl" border flat class="pa-8 text-center bg-grey-lighten-5">
          <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-file-search-outline</v-icon>
          <div class="text-grey-darken-1 font-weight-medium">Todavía no creaste ninguna hoja de servicio.</div>
          <v-btn color="primary" variant="text" class="mt-2 font-weight-bold" @click="openCreateModal">
            Crear mi primera hoja aquí
          </v-btn>
        </v-card>
      </div>

      <!-- SECCIÓN DE AUDITORÍA (SÓLO ADMIN) -->
      <div v-if="authStore.userRole === 1" class="mb-8">
        <div class="d-flex align-center mb-4">
          <v-icon color="deep-purple-lighten-1" class="mr-2">mdi-shield-search</v-icon>
          <h2 class="text-h5 font-weight-black">Auditoría de Hojas</h2>
        </div>
        <v-card rounded="xl" border flat class="pa-4 bg-grey-lighten-5 text-center">
          <div class="text-grey-darken-1">Como Administrador, podés supervisar todas las hojas generadas en el sistema.</div>
          <v-btn color="deep-purple" variant="flat" rounded="pill" class="mt-4 px-8 font-weight-bold">
            Ingresar al Panel de Auditoría
          </v-btn>
        </v-card>
      </div>

      <!-- MODALES -->
      <ServiceSheetTemplate
        v-if="selectedSheet"
        :show="detailsModal"
        :sheet="selectedSheet"
        @close="detailsModal = false"
      />

      <ServiceSheetCreateModal
        :show="createModal"
        :saving="saving"
        :edit-data="selectedSheet"
        @close="closeCreateModal"
        @save="saveSheet"
      />

      <RequestAvailabilityModal
        :show="availabilityModal"
        :loading="sendingRequest"
        @close="availabilityModal = false"
        @send="handleSendRequest"
      />

      <v-dialog v-model="shiftModal" max-width="350">
        <v-card rounded="xl" class="pa-4">
          <v-card-title class="text-h6 font-weight-black text-center">Configurar Turno</v-card-title>
          <v-card-text>
            <div class="d-flex ga-2 align-center mb-4">
              <v-text-field v-model="tempShift.start" type="time" label="Desde" variant="solo-filled" flat rounded="lg" hide-details />
              <v-text-field v-model="tempShift.end" type="time" label="Hasta" variant="solo-filled" flat rounded="lg" hide-details />
            </div>
            <v-btn block color="success" rounded="pill" variant="elevated" @click="saveShift" :loading="savingShift">
              Guardar Horario
            </v-btn>
            <v-btn block variant="text" color="grey" class="mt-2" @click="shiftModal = false">Cancelar</v-btn>
            <v-btn v-if="selectedSheet?.shifts?.[selectedShiftIdx]" block variant="text" color="error" class="mt-1" size="small" @click="removeShift">
              Eliminar Turno
            </v-btn>
          </v-card-text>
        </v-card>
      </v-dialog>

      <v-dialog v-model="deleteDialog" max-width="400">
        <v-card rounded="xl" class="pa-4">
          <v-card-title class="text-h6 font-weight-black text-center">Confirmar Borrado</v-card-title>
          <v-card-text class="text-center py-4">
            ¿Estás seguro que desea eliminar la planilla <br>
            <span class="font-weight-black">{{ sheetToDelete?.month }} {{ sheetToDelete?.year }}</span>?
          </v-card-text>
          <v-card-actions>
            <v-btn block color="error" rounded="pill" variant="elevated" @click="confirmDelete" :loading="deleting">
              Eliminar Definitivamente
            </v-btn>
          </v-card-actions>
          <v-btn block variant="text" color="grey" class="mt-2" @click="deleteDialog = false">Cancelar</v-btn>
        </v-card>
      </v-dialog>

      <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="pill">
        {{ snackbarText }}
      </v-snackbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../plugins/firebase'
import { useAuthStore } from '../modules/auth/stores/authStore'
import ServiceSheetTemplate from '../components/ServiceSheetTemplate.vue'
import ServiceSheetCreateModal from '../modules/home/components/ServiceSheetCreateModal.vue'
import RequestAvailabilityModal from '../modules/home/components/RequestAvailabilityModal.vue'

const authStore = useAuthStore()
const createModal = ref(false)
const detailsModal = ref(false)
const deleteDialog = ref(false)
const shiftModal = ref(false)
const availabilityModal = ref(false)
const selectedSheet = ref<any>(null)
const sheetToDelete = ref<any>(null)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const saving = ref(false)
const deleting = ref(false)
const savingShift = ref(false)
const sendingRequest = ref(false)
const loadingSheets = ref(true)
const sheets = ref<any[]>([])
let unsubscribe: any = null

const selectedShiftIdx = ref(0)
const tempShift = reactive({ start: '', end: '' })

// Lógica de Disponibilidad
const handleSendRequest = async (data: any) => {
  sendingRequest.value = true
  try {
    console.log('Enviando solicitud a:', data.emails, 'Mensaje:', data.message)
    // Aquí iría la lógica para enviar mails o crear notificaciones en Firestore
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulación
    
    availabilityModal.value = false
    snackbarText.value = `Solicitud enviada a ${data.emails.length} personas`
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('Error enviando solicitud:', err)
  } finally {
    sendingRequest.value = false
  }
}

const openShiftModal = (sheet: any, idx: number) => {
  selectedSheet.value = sheet
  selectedShiftIdx.value = idx
  if (sheet.shifts?.[idx]) {
    tempShift.start = sheet.shifts[idx].start
    tempShift.end = sheet.shifts[idx].end
  } else {
    tempShift.start = '08:00'
    tempShift.end = '16:00'
  }
  shiftModal.value = true
}

const saveShift = async () => {
  if (!selectedSheet.value) return
  savingShift.value = true
  try {
    const currentShifts = selectedSheet.value.shifts || []
    const newShifts = [...currentShifts]
    while (newShifts.length <= selectedShiftIdx.value) newShifts.push(null)
    newShifts[selectedShiftIdx.value] = { ...tempShift }
    
    await updateDoc(doc(db, 'servicios', selectedSheet.value.id), {
      shifts: newShifts
    })
    
    shiftModal.value = false
    snackbarText.value = 'Horario actualizado'
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('Error al guardar turno:', err)
  } finally {
    savingShift.value = false
  }
}

const removeShift = async () => {
  if (!selectedSheet.value) return
  try {
    const newShifts = [...(selectedSheet.value.shifts || [])]
    newShifts[selectedShiftIdx.value] = null
    
    await updateDoc(doc(db, 'servicios', selectedSheet.value.id), {
      shifts: newShifts
    })
    shiftModal.value = false
  } catch (err) {
    console.error('Error al eliminar turno:', err)
  }
}

const handleAutocomplete = (sheet: any) => {
  console.log('Autocompletar hoja:', sheet.id)
  snackbarText.value = 'Función Autocompletar: Próximamente disponible'
  snackbarColor.value = 'info'
  snackbar.value = true
}

// Cargar Hojas de Servicio
onMounted(() => {
  if (authStore.user) {
    const q = query(
      collection(db, 'servicios'),
      where('userId', '==', authStore.user.uid)
    )
    
    unsubscribe = onSnapshot(q, (snap) => {
      const rawDocs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
      sheets.value = rawDocs.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
        return dateB.getTime() - dateA.getTime()
      })
      loadingSheets.value = false
    })
  }
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

const openCreateModal = () => {
  selectedSheet.value = null
  createModal.value = true
}

const openEditModal = (sheet: any) => {
  selectedSheet.value = sheet
  createModal.value = true
}

const closeCreateModal = () => {
  createModal.value = false
  selectedSheet.value = null
}

const askDelete = (sheet: any) => {
  sheetToDelete.value = sheet
  deleteDialog.value = true
}

const confirmDelete = async () => {
  if (!sheetToDelete.value) return
  deleting.value = true
  try {
    await deleteDoc(doc(db, 'servicios', sheetToDelete.value.id))
    deleteDialog.value = false
    snackbarText.value = 'Planilla eliminada correctamente'
    snackbarColor.value = 'error'
    snackbar.value = true
  } catch (err) {
    console.error('Error al borrar:', err)
  } finally {
    deleting.value = false
  }
}

const openSheetDetails = (sheet: any) => {
  selectedSheet.value = sheet
  detailsModal.value = true
}

const getStatusColor = (status: string) => {
  return status === 'pending' ? 'amber-darken-2' : 'success'
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return '---'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

const saveSheet = async (data: any) => {
  if (!authStore.user) return
  saving.value = true
  try {
    if (selectedSheet.value?.id) {
      await updateDoc(doc(db, 'servicios', selectedSheet.value.id), { ...data, updatedAt: new Date() })
      snackbarText.value = 'Hoja de servicio actualizada'
    } else {
      await addDoc(collection(db, 'servicios'), {
        ...data,
        userId: authStore.user.uid,
        userName: authStore.userData?.displayName || 'Usuario',
        status: 'pending', 
        createdAt: new Date(),
        shifts: []
      })
      snackbarText.value = 'Hoja de servicio generada correctamente'
    }
    createModal.value = false
    snackbarColor.value = 'success'
    snackbar.value = true
    selectedSheet.value = null
  } catch (err) {
    console.error('[Home] Error guardando servicio:', err)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.max-width-container { max-width: 1200px; }
.line-height-1 { line-height: 1; }
.shadow-primary { box-shadow: 0 4px 15px rgba(var(--v-theme-primary), 0.4) !important; }
.hover-elevate-soft { transition: all 0.3s ease; cursor: pointer; }
.hover-elevate-soft:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.1) !important; border-color: rgb(var(--v-theme-primary)) !important; }
</style>
