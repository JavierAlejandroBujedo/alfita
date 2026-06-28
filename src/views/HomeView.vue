<template>
  <div class="home-view pa-4 pa-md-0">
    <div class="max-width-container mx-auto">
      
      <!-- SECCIÓN 1: SERVICIOS VINCULADOS -->
      <section v-if="hasLinkedServices" class="mb-12">
        <div class="d-flex align-center mb-4">
          <v-icon color="success" class="mr-2">mdi-link-variant</v-icon>
          <h2 class="text-h5 font-weight-black">Servicios que solicitan mi disponibilidad</h2>
          <v-spacer></v-spacer>
          <v-chip size="small" variant="tonal" color="success" class="font-weight-bold">
            {{ visibleLinkedServices.length }} PENDIENTE{{ visibleLinkedServices.length !== 1 ? 'S' : '' }}
          </v-chip>
        </div>

        <v-row>
          <v-col v-for="linked in visibleLinkedServices" :key="linked.id" cols="12" md="6">
            <LinkedServiceCard 
              :linked="linked"
              :has-submitted="hasSubmittedForService(linked.id)"
              @click="openSubmitForService(linked)"
            />
          </v-col>
        </v-row>
      </section>

      <!-- SECCIÓN 2: BIENVENIDA ASIGNADO -->
      <WelcomeAsignado 
        v-if="authStore.userRole === 3 && !hasLinkedServices" 
        :membership-type="authStore.userData?.membershipType"
      />

      <!-- SECCIÓN 3: MIS HOJAS (Designador/Admin) -->
      <section v-if="isDesignadorOrAdmin" class="mb-12">
        <div class="d-flex align-center mb-4">
          <v-icon color="primary" class="mr-2">mdi-file-document-multiple</v-icon>
          <h2 class="text-h5 font-weight-black">Mis Hojas de Servicio</h2>
          <HomeQuickButtons 
            class="ml-md-16"
            :is-designador-or-admin="isDesignadorOrAdmin"
            :has-pending="pendingLinkedServices.length > 0"
            @staff-availability="staffAvailabilityModal = true"
            @request-availability="availabilityModal = true"
            @create-sheet="openCreateModal"
            @submit-availability="openAvailabilitySubmit"
          />
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

        <template v-else>
          <v-row v-if="sheets.length > 0">
            <v-col v-for="sheet in sheets" :key="sheet.id" cols="12" md="6">
              <ServiceSheetCard 
                :sheet="sheet"
                :linked-count="getLinkedEmailCount(sheet.id)"
                @view="openSheetDetails"
                @confirm="askConfirmDesignation"
                @autocomplete="handleAutocomplete"
                @edit="openEditModal"
                @delete="askDelete"
                @configure-shift="({ sheet, idx }) => openShiftModal(sheet, idx)"
              />
            </v-col>
          </v-row>
          
          <v-card v-else rounded="xl" border flat class="pa-8 text-center bg-grey-lighten-5">
            <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-file-search-outline</v-icon>
            <div class="text-grey-darken-1 font-weight-medium">Todavía no creaste ninguna hoja de servicio.</div>
            <v-btn color="primary" variant="text" class="mt-2 font-weight-bold" @click="openCreateModal">
              Crear mi primera hoja aquí
            </v-btn>
          </v-card>
        </template>
      </section>

      <!-- MODALES Y DIÁLOGOS -->
      <ServiceSheetTemplate v-if="selectedSheet" :show="detailsModal" :sheet="selectedSheet" :availability="allAvailability" @close="detailsModal = false" />
      <ServiceSheetCreateModal :show="createModal" :saving="saving" :edit-data="selectedSheet" @close="closeCreateModal" @save="handleSave" />
      <RequestAvailabilityModal :show="availabilityModal" :loading="sendingRequest" :sheets="sheets" @close="availabilityModal = false" @send="handleSendRequest" />
      <StaffAvailabilityModal :show="staffAvailabilityModal" :loading="loadingAvailability" :sheets="sheets" :availability-data="allAvailability" :linked-emails-map="linkedEmailsMap" @close="staffAvailabilityModal = false" @unlink="handleUnlinkUser" />
      <AvailabilitySubmitModal :show="submitAvailabilityModal" :loading="submittingAvailability" :service-data="selectedLinkedService" @close="submitAvailabilityModal = false" @submit="handleSubmitAvailability" />

      <!-- Diálogos de Confirmación -->
      <v-dialog v-model="shiftModal" max-width="350">
        <v-card rounded="xl" class="pa-4">
          <v-card-title class="text-h6 font-weight-black text-center">Configurar Turno</v-card-title>
          <v-card-text>
            <div class="d-flex ga-2 align-center mb-4">
              <v-text-field v-model="tempShift.start" type="time" label="Desde" variant="solo-filled" flat rounded="lg" hide-details />
              <v-text-field v-model="tempShift.end" type="time" label="Hasta" variant="solo-filled" flat rounded="lg" hide-details />
            </div>
            <v-btn block color="success" rounded="pill" variant="elevated" @click="saveShift" :loading="savingShift">Guardar Horario</v-btn>
            <v-btn block variant="text" color="grey" class="mt-2" @click="shiftModal = false">Cancelar</v-btn>
            <v-btn v-if="selectedSheet?.shifts?.[selectedShiftIdx]" block variant="text" color="error" class="mt-1" size="small" @click="removeShift">Eliminar Turno</v-btn>
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
            <v-btn block color="error" rounded="pill" variant="elevated" @click="confirmDelete" :loading="deleting">Eliminar Definitivamente</v-btn>
          </v-card-actions>
          <v-btn block variant="text" color="grey" class="mt-2" @click="deleteDialog = false">Cancelar</v-btn>
        </v-card>
      </v-dialog>

      <v-dialog v-model="confirmDesignationDialog" max-width="450">
        <v-card rounded="xl" class="pa-6 text-center">
          <v-icon color="success" size="64" class="mb-4">mdi-check-decagram-outline</v-icon>
          <v-card-title class="text-h5 font-weight-black">¿Confirmar designaciones?</v-card-title>
          <v-card-text class="text-body-1 py-4">
            ¿Estás seguro que deseás confirmar esta acción?<br>
            <strong>Se publicarán los turnos para los usuarios designados.</strong>
          </v-card-text>
          <div class="d-flex ga-2 px-4 pb-4">
            <v-btn flex-grow-1 variant="tonal" color="grey" rounded="pill" @click="confirmDesignationDialog = false">Cancelar</v-btn>
            <v-btn flex-grow-1 color="success" rounded="pill" variant="elevated" class="font-weight-bold" @click="handleConfirmDesignation" :loading="confirming">Confirmar</v-btn>
          </div>
        </v-card>
      </v-dialog>

      <v-dialog v-model="incompleteDialog" max-width="450">
        <v-card rounded="xl" class="pa-6 text-center">
          <v-icon color="warning" size="64" class="mb-4">mdi-alert-rhombus-outline</v-icon>
          <v-card-title class="text-h5 font-weight-black">Planilla Incompleta</v-card-title>
          <v-card-text class="text-body-1 py-4">Por favor, completá todas las designaciones antes de finalizar.</v-card-text>
          <v-btn block color="warning" rounded="pill" variant="elevated" class="font-weight-bold" @click="incompleteDialog = false">Continuar editando</v-btn>
        </v-card>
      </v-dialog>

      <!-- DIÁLOGO DE CONFIRMACIÓN ELIMINAR TURNO -->
      <v-dialog v-model="deleteConfirm.show" max-width="400">
        <v-card rounded="xl" class="pa-4">
          <v-card-title class="text-h6 font-weight-black d-flex align-center">
            <v-icon color="error" class="mr-2">mdi-alert-circle-outline</v-icon>
            ¿Eliminar turno?
          </v-card-title>
          <v-card-text class="pt-2 text-body-1">
            ¿Estás seguro que deseás eliminar el turno del servicio 
            <span class="font-weight-black text-primary">Nº {{ deleteConfirm.svc }}</span> 
            de <span class="font-weight-bold">{{ deleteConfirm.date }}</span>? 
            <br><br>
            Esta acción no se puede deshacer.
          </v-card-text>
          <v-card-actions class="pt-4">
            <v-spacer></v-spacer>
            <v-btn variant="text" color="grey" @click="deleteConfirm.show = false">Cancelar</v-btn>
            <v-btn color="error" variant="elevated" rounded="pill" class="px-6 font-weight-bold" @click="handleRemoveLinked">
              Eliminar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" rounded="pill">
        {{ snackbar.text }}
      </v-snackbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../plugins/firebase'
import { useAuthStore } from '../modules/auth/stores/authStore'

// Componentes
import WelcomeAsignado from '../modules/home/components/WelcomeAsignado.vue'
import HomeQuickButtons from '../modules/home/components/HomeQuickButtons.vue'
import LinkedServiceCard from '../modules/home/components/LinkedServiceCard.vue'
import ServiceSheetCard from '../modules/home/components/ServiceSheetCard.vue'

// Modales
import ServiceSheetTemplate from '../components/ServiceSheetTemplate.vue'
import ServiceSheetCreateModal from '../modules/home/components/ServiceSheetCreateModal.vue'
import RequestAvailabilityModal from '../modules/home/components/RequestAvailabilityModal.vue'
import StaffAvailabilityModal from '../modules/home/components/StaffAvailabilityModal.vue'
import AvailabilitySubmitModal from '../modules/home/components/AvailabilitySubmitModal.vue'

const authStore = useAuthStore()
const createModal = ref(false)
const detailsModal = ref(false)
const deleteDialog = ref(false)
const shiftModal = ref(false)
const availabilityModal = ref(false)
const staffAvailabilityModal = ref(false)
const submitAvailabilityModal = ref(false)
const selectedSheet = ref<any>(null)
const sheetToDelete = ref<any>(null)
const snackbar = reactive({ show: false, text: '', color: 'success' })
const saving = ref(false)
const deleting = ref(false)
const savingShift = ref(false)
const confirming = ref(false)
const sendingRequest = ref(false)
const confirmDesignationDialog = ref(false)
const loadingSheets = ref(true)
const loadingAvailability = ref(false)
const submittingAvailability = ref(false)
const sheets = ref<any[]>([])
const linkedServices = ref<any[]>([])
const allAvailability = ref<any[]>([])
const linkedEmailsMap = ref<Record<string, string[]>>({})
const mySubmissions = ref<any[]>([])
const selectedLinkedService = ref<any>(null)
const incompleteDialog = ref(false)
const selectedShiftIdx = ref(0)
const tempShift = reactive({ start: '', end: '' })

// Diálogo de eliminación de turno vinculado
const deleteConfirm = reactive({
  show: false,
  linkId: '',
  svc: '',
  date: ''
})

let unsubscribe: any = null
let unsubscribeLinked: any = null
let unsubscribeAvailability: any = null

const isDesignadorOrAdmin = computed(() => authStore.userRole === 1 || authStore.userRole === 2)
const hasLinkedServices = computed(() => visibleLinkedServices.value.length > 0)
const pendingLinkedServices = computed(() => linkedServices.value.filter(s => s.status === 'pending'))

const visibleLinkedServices = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

  const validLinks = linkedServices.value.filter(s => {
    const sMonthIdx = monthNames.indexOf(s.sheetData?.month?.toUpperCase())
    const sYear = parseInt(s.sheetData?.year)
    if (isNaN(sYear) || sMonthIdx === -1) return true
    if (sYear < currentYear) return false
    if (sYear === currentYear && sMonthIdx < currentMonth) return false
    return true
  })

  const groups = new Map()
  validLinks.forEach(s => {
    const key = `${s.sheetData?.svcNumber}-${s.sheetData?.month}-${s.sheetData?.year}`
    if (!groups.has(key)) {
      groups.set(key, {
        id: key, 
        isGroup: true,
        svcNumber: s.sheetData?.svcNumber,
        month: s.sheetData?.month,
        year: s.sheetData?.year,
        description: s.sheetData?.description,
        shifts: s.sheetData?.shifts,
        status: s.sheetData?.status || 'pending',
        sheetIds: [s.serviceId],
        linkIds: [s.id]
      })
    } else {
      const g = groups.get(key)
      if (!g.sheetIds.includes(s.serviceId)) {
        g.sheetIds.push(s.serviceId)
      }
      g.linkIds.push(s.id)
      if (s.sheetData?.status === 'pending') {
        g.status = 'pending'
      }
    }
  })
  
  return Array.from(groups.values())
})

const clearListeners = () => {
  if (unsubscribe) unsubscribe()
  if (unsubscribeLinked) unsubscribeLinked()
  if (unsubscribeAvailability) unsubscribeAvailability()
  unsubscribe = null
  unsubscribeLinked = null
  unsubscribeAvailability = null
}

const initData = () => {
  // Solo procedemos si tenemos el usuario de Firebase Y sus datos de perfil de Firestore
  if (!authStore.user || !authStore.userData) {
    if (authStore.user) console.log('[HomeView] Esperando que carguen los datos de perfil (userData)...')
    return
  }
  
  console.log('[HomeView] Perfil detectado:', {
    email: authStore.user.email,
    role: authStore.userRole,
    migrated: !!authStore.userData.uid
  })

  clearListeners()
  
  if (isDesignadorOrAdmin.value) {
    console.log('[HomeView] Iniciando fetchSheets para Designador/Admin')
    fetchSheets()
  } else {
    console.log('[HomeView] Usuario es Asignado, cargando solo turnos vinculados')
  }
  
  fetchLinkedServices()
  fetchAvailabilityResponses()
}

onMounted(() => {
  initData()
})

// Observamos usuario, rol y datos de perfil para reaccionar a la migración
watch([() => authStore.user, () => authStore.userRole, () => authStore.userData], () => {
  initData()
}, { immediate: false, deep: true })

onUnmounted(() => {
  clearListeners()
})

const fetchSheets = (retryCount = 0) => {
  const uid = authStore.user?.uid
  const email = authStore.user?.email
  
  // GUARDIA ESTRICTA: Si no es Admin/Designador, no consultamos
  if (!uid || !isDesignadorOrAdmin.value) {
    if (uid) console.log('[HomeView] fetchSheets cancelado: Usuario no tiene rol de administrador/designador aún.')
    return
  }

  loadingSheets.value = true
  
  // Consulta 1: Por UID
  const qUid = query(collection(db, 'serviceSheets'), where('createdBy', '==', uid))
  const unsubUid = onSnapshot(qUid, (snapshot) => {
    updateSheets(snapshot.docs, 'uid')
  }, (err) => {
    if (err.code === 'permission-denied' && retryCount < 3) {
      // Silencioso mientras reintentamos
      setTimeout(() => fetchSheets(retryCount + 1), 1000)
    } else {
      loadingSheets.value = false
      // Solo mostramos error si no es de permisos (o si ya fallaron los reintentos)
      if (err.code !== 'permission-denied') console.error('[HomeView] Error UID:', err)
    }
  })

  // Consulta 2: Por Email
  let unsubEmail: any = null
  if (email) {
    const qEmail = query(collection(db, 'serviceSheets'), where('createdByEmail', '==', email))
    unsubEmail = onSnapshot(qEmail, (snapshot) => {
      updateSheets(snapshot.docs, 'email')
    }, (err) => {
      if (err.code === 'permission-denied' && retryCount < 3) {
        setTimeout(() => fetchSheets(retryCount + 1), 800)
      }
    })
  }

  unsubscribe = () => {
    unsubUid()
    if (unsubEmail) unsubEmail()
  }
}

const sheetsBySource = reactive({ uid: [] as any[], email: [] as any[] })

const updateSheets = (docs: any[], source: 'uid' | 'email') => {
  const data = docs.map(doc => ({ id: doc.id, ...doc.data() }))
  sheetsBySource[source] = data
  
  const combined = [...sheetsBySource.uid, ...sheetsBySource.email]
  const unique = Array.from(new Map(combined.map(s => [s.id, s])).values())
  
  const monthMap: Record<string, number> = { 'ENERO': 0, 'FEBRERO': 1, 'MARZO': 2, 'ABRIL': 3, 'MAYO': 4, 'JUNIO': 5, 'JULIO': 6, 'AGOSTO': 7, 'SEPTIEMBRE': 8, 'OCTUBRE': 9, 'NOVIEMBRE': 10, 'DICIEMBRE': 11 }
  
  sheets.value = unique.sort((a, b) => {
    const yearA = parseInt(a.year) || 0
    const yearB = parseInt(b.year) || 0
    if (yearA !== yearB) return yearB - yearA
    const monthA = monthMap[a.month?.toUpperCase()] ?? 0
    const monthB = monthMap[b.month?.toUpperCase()] ?? 0
    return monthB - monthA
  })
  loadingSheets.value = false
}

const fetchLinkedServices = () => {
  const uid = authStore.user?.uid
  if (!uid) return
  
  const q = query(collection(db, 'service_links'), where('userId', '==', uid), where('active', '==', true))
  unsubscribeLinked = onSnapshot(q, async (snapshot) => {
    const links = []
    const now = new Date()
    const currentMonthIdx = now.getMonth()
    const currentYear = now.getFullYear()
    const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

    for (const docSnap of snapshot.docs) {
      const linkData = { id: docSnap.id, ...docSnap.data() } as any
      const sheetRef = doc(db, 'serviceSheets', linkData.serviceId)
      const sheetSnap = await getDoc(sheetRef)
      
      if (sheetSnap.exists()) {
        const sheetData = sheetSnap.data()
        const sheetMonthIdx = months.indexOf(sheetData.month?.toUpperCase())
        const sheetYear = parseInt(sheetData.year)
        
        if (sheetYear < currentYear || (sheetYear === currentYear && sheetMonthIdx < currentMonthIdx)) {
          continue 
        }
        links.push({ ...linkData, sheetData })
      }
    }
    linkedServices.value = links
  })
}

const fetchAvailabilityResponses = () => {
  const uid = authStore.user?.uid
  if (!uid) return
  const q = query(collection(db, 'availability'), where('userId', '==', uid))
  unsubscribeAvailability = onSnapshot(q, (snapshot) => {
    mySubmissions.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    if (!isDesignadorOrAdmin.value) allAvailability.value = mySubmissions.value
  })

  if (isDesignadorOrAdmin.value) {
    const qAll = query(collection(db, 'availability'))
    const unsubAll = onSnapshot(qAll, (snapshot) => {
      allAvailability.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      mySubmissions.value = allAvailability.value.filter(a => a.userId === uid)
      const map: Record<string, string[]> = {}
      snapshot.docs.forEach(doc => {
        const data = doc.data() as any
        if (data.serviceId) {
          if (!map[data.serviceId]) map[data.serviceId] = []
          if (!map[data.serviceId].includes(data.userEmail)) map[data.serviceId].push(data.userEmail)
        }
      })
      linkedEmailsMap.value = map
    })
    const prevUnsub = unsubscribeAvailability
    unsubscribeAvailability = () => { prevUnsub?.(); unsubAll() }
  }
}

const openCreateModal = () => {
  selectedSheet.value = null
  createModal.value = true
}

const openEditModal = (sheet: any) => {
  selectedSheet.value = { ...sheet }
  createModal.value = true
}

const closeCreateModal = () => {
  createModal.value = false
  selectedSheet.value = null
}

const handleSave = async (data: any) => {
  saving.value = true
  try {
    if (selectedSheet.value) {
      await updateDoc(doc(db, 'serviceSheets', selectedSheet.value.id), { ...data, updatedAt: serverTimestamp() })
    } else {
      await addDoc(collection(db, 'serviceSheets'), { 
        ...data, 
        createdBy: authStore.user?.uid, 
        createdByEmail: authStore.user?.email,
        status: 'pending', 
        createdAt: serverTimestamp() 
      })
    }
    showSnackbar('Hoja guardada correctamente')
    closeCreateModal()
  } catch (err: any) {
    console.error('[HomeView] Error al guardar la hoja:', err)
    showSnackbar(`Error al guardar: ${err.message || 'Desconocido'}`, 'error')
  } finally {
    saving.value = false
  }
}

const confirmRemoveLinked = (linkToRemove: any) => {
  deleteConfirm.linkId = linkToRemove.id
  deleteConfirm.svc = linkToRemove.sheetData?.svcNumber || '---'
  deleteConfirm.date = `${linkToRemove.sheetData?.month} ${linkToRemove.sheetData?.year}`
  deleteConfirm.show = true
}

const handleRemoveLinked = async () => {
  if (!deleteConfirm.linkId) return
  try {
    await updateDoc(doc(db, 'service_links', deleteConfirm.linkId), { active: false })
    showSnackbar('Turno eliminado correctamente')
    deleteConfirm.show = false
  } catch (err) {
    showSnackbar('Error al eliminar el turno', 'error')
  }
}

const viewSheetDetail = (sheetToView: any) => {
  selectedSheet.value = sheetToView
  detailsModal.value = true
}

// Vinculación explícita para evitar warnings del IDE
const _ideFix = { confirmRemoveLinked, viewSheetDetail }
console.log('[HomeView] Handlers listos:', !!_ideFix)

const askDelete = (sheet: any) => {
  sheetToDelete.value = sheet
  deleteDialog.value = true
}

const confirmDelete = async () => {
  if (!sheetToDelete.value) return
  deleting.value = true
  try {
    await deleteDoc(doc(db, 'serviceSheets', sheetToDelete.value.id))
    showSnackbar('Eliminado correctamente')
    deleteDialog.value = false
  } catch (e) {
    showSnackbar('Error al eliminar', 'error')
  } finally {
    deleting.value = false
  }
}

const openSheetDetails = (sheet: any) => {
  selectedSheet.value = sheet
  detailsModal.value = true
}

const openShiftModal = (sheet: any, idx: number) => {
  selectedSheet.value = sheet
  selectedShiftIdx.value = idx
  tempShift.start = sheet.shifts?.[idx]?.start || '08:00'
  tempShift.end = sheet.shifts?.[idx]?.end || '20:00'
  shiftModal.value = true
}

const saveShift = async () => {
  if (!selectedSheet.value) return
  savingShift.value = true
  const newShifts = [...(selectedSheet.value.shifts || [null, null, null])]
  newShifts[selectedShiftIdx.value] = { ...tempShift }
  try {
    await updateDoc(doc(db, 'serviceSheets', selectedSheet.value.id), { shifts: newShifts })
    shiftModal.value = false
  } catch (e) {
    showSnackbar('Error al guardar turno', 'error')
  } finally {
    savingShift.value = false
  }
}

const removeShift = async () => {
  if (!selectedSheet.value) return
  savingShift.value = true
  const newShifts = [...(selectedSheet.value.shifts || [null, null, null])]
  newShifts[selectedShiftIdx.value] = null
  try {
    await updateDoc(doc(db, 'serviceSheets', selectedSheet.value.id), { shifts: newShifts })
    shiftModal.value = false
  } catch (e) {
    showSnackbar('Error al eliminar turno', 'error')
  } finally {
    savingShift.value = false
  }
}

const handleAutocomplete = async (_sheet: any) => {
  showSnackbar('Autocompletando planilla...', 'info')
  // Lógica de autocompletado...
}

const askConfirmDesignation = (sheet: any) => {
  selectedSheet.value = sheet
  confirmDesignationDialog.value = true
}

const handleConfirmDesignation = async () => {
  if (!selectedSheet.value) return
  confirming.value = true
  try {
    await updateDoc(doc(db, 'serviceSheets', selectedSheet.value.id), { status: 'confirmed', confirmedAt: serverTimestamp() })
    showSnackbar('Planilla confirmada y turnos publicados')
    confirmDesignationDialog.value = false
  } catch (e) {
    showSnackbar('Error al confirmar', 'error')
  } finally {
    confirming.value = false
  }
}

const handleSendRequest = async ({ serviceIds, emails }: { serviceIds: string[], emails: string[] }) => {
  sendingRequest.value = true
  console.log('[Solicitud] Iniciando envío. Emails:', emails, '| Hojas (sheetIds):', serviceIds)
  try {
    // 1. Resolver emails a UIDs
    const resolvedUsers: any[] = []
    for (let i = 0; i < emails.length; i += 10) {
      const chunk = emails.slice(i, i + 10)
      const qUsers = query(collection(db, 'users'), where('email', 'in', chunk))
      const userSnaps = await getDocs(qUsers)
      userSnaps.forEach(u => resolvedUsers.push({ id: u.id, email: u.data().email }))
    }
    console.log('[Solicitud] Usuarios encontrados en Firestore:', resolvedUsers)

    if (resolvedUsers.length === 0) {
      showSnackbar('Ningún correo ingresado tiene cuenta registrada en Alfita', 'warning')
      sendingRequest.value = false
      return
    }

    // 2. Iterar sobre hojas y guardar vinculación
    await Promise.all(serviceIds.map(async (sheetId) => {
      console.log('[Solicitud] Procesando hoja:', sheetId)
      // 2a. Actualizar linkedEmails en la hoja (para el panel del designador)
      const sheetRef = doc(db, 'serviceSheets', sheetId)
      const snap = await getDoc(sheetRef)
      if (snap.exists()) {
        const currentEmails = snap.data()?.linkedEmails || []
        const combinedEmails = Array.from(new Set([...currentEmails, ...emails]))
        await updateDoc(sheetRef, { linkedEmails: combinedEmails })
        console.log('[Solicitud] linkedEmails actualizado en hoja', sheetId)
      }

      // 2b. Crear o reactivar el service_link para que aparezca la tarjeta al "Asignado"
      for (const u of resolvedUsers) {
        const qLink = query(
          collection(db, 'service_links'),
          where('serviceId', '==', sheetId),
          where('userId', '==', u.id)
        )
        const linkSnaps = await getDocs(qLink)

        if (linkSnaps.empty) {
          const newRef = await addDoc(collection(db, 'service_links'), {
            serviceId: sheetId,
            userId: u.id,
            email: u.email,
            active: true,
            createdAt: serverTimestamp()
          })
          console.log('[Solicitud] service_link CREADO:', newRef.id, 'para usuario', u.email)
        } else {
          const existing = linkSnaps.docs[0]
          if (!existing.data().active) {
            await updateDoc(doc(db, 'service_links', existing.id), { active: true, updatedAt: serverTimestamp() })
            console.log('[Solicitud] service_link REACTIVADO:', existing.id, 'para usuario', u.email)
          } else {
            console.log('[Solicitud] service_link ya existía y estaba activo para', u.email)
          }
        }
      }
    }))

    showSnackbar('Solicitud enviada correctamente a los usuarios')
    availabilityModal.value = false
  } catch (e: any) {
    console.error('[HomeView] Error al solicitar disponibilidad múltiple:', e)
    showSnackbar('Error al enviar solicitud, revisá los permisos.', 'error')
  } finally {
    sendingRequest.value = false
  }
}

const openSubmitForService = (service: any) => {
  selectedLinkedService.value = service
  submitAvailabilityModal.value = true
}

const openAvailabilitySubmit = () => {
  if (visibleLinkedServices.value.length === 1) {
    openSubmitForService(visibleLinkedServices.value[0])
  } else {
    showSnackbar('Seleccioná un servicio de la lista de abajo', 'info')
  }
}

const handleSubmitAvailability = async (payload: any) => {
  submittingAvailability.value = true
  try {
    const targetIds = selectedLinkedService.value.sheetIds || [selectedLinkedService.value.id]
    await Promise.all(targetIds.map(async (sid: string) => {
      const existing = mySubmissions.value.find(a => a.serviceId === sid)
      if (existing) {
        await updateDoc(doc(db, 'availability', existing.id), { ...payload, updatedAt: serverTimestamp() })
      } else {
        await addDoc(collection(db, 'availability'), { 
          ...payload, 
          userId: authStore.user?.uid, 
          userName: authStore.userData?.displayName || authStore.user?.displayName || 'Usuario',
          userEmail: authStore.user?.email,
          serviceId: sid,
          createdAt: serverTimestamp() 
        })
      }
    }))
    showSnackbar('Disponibilidad cargada con éxito')
    submitAvailabilityModal.value = false
  } catch (e: any) {
    console.error('Error enviando disponibilidad:', e)
    showSnackbar('Error al enviar disponibilidad', 'error')
  } finally {
    submittingAvailability.value = false
  }
}

const handleUnlinkUser = async ({ sheetId, email }: { sheetId: string, email: string }) => {
  try {
    const sheetRef = doc(db, 'serviceSheets', sheetId)
    const snap = await getDoc(sheetRef)
    const currentEmails = snap.data()?.linkedEmails || []
    const updatedEmails = currentEmails.filter((e: string) => e !== email)
    await updateDoc(sheetRef, { linkedEmails: updatedEmails })
    showSnackbar('Usuario desvinculado')
  } catch (e) {
    showSnackbar('Error al desvincular', 'error')
  }
}

const hasSubmittedForService = (groupId: string) => {
  const group = visibleLinkedServices.value.find(g => g.id === groupId)
  if (!group) return false
  return group.sheetIds.some((sid: string) => mySubmissions.value.some(a => a.serviceId === sid))
}

const getLinkedEmailCount = (sheetId: string) => {
  return linkedEmailsMap.value[sheetId]?.length || 0
}

const showSnackbar = (text: string, color: string = 'success') => {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}
</script>

<style scoped>
.home-view { min-height: 90vh; }
.max-width-container { max-width: 1200px; }
.shadow-primary { box-shadow: 0 4px 15px rgba(25, 118, 210, 0.4) !important; }
</style>
