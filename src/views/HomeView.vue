<template>
  <div class="home-view pa-4 pa-md-8">
    <div class="max-width-container mx-auto">
      
      <!-- CABECERA DE ACCIONES RÁPIDAS -->
      <header class="d-flex flex-column flex-md-row justify-end align-start align-md-center mb-8 ga-3">
        
        <!-- BOTÓN: VER DISPONIBILIDAD (Solo Designador/Admin - Rol 1 o 3) -->
        <v-btn
          v-if="isDesignadorOrAdmin"
          color="teal-lighten-4"
          variant="flat"
          prepend-icon="mdi-account-clock"
          rounded="pill"
          class="font-weight-bold px-6 text-teal-darken-4"
          @click="staffAvailabilityModal = true"
        >
          Ver disponibilidad del personal
        </v-btn>

        <!-- BOTÓN: SOLICITAR DISPONIBILIDAD (Solo Designador/Admin - Rol 1 o 3) -->
        <v-btn
          v-if="isDesignadorOrAdmin"
          color="deep-orange-lighten-4"
          variant="flat"
          prepend-icon="mdi-email-plus-outline"
          rounded="pill"
          class="font-weight-bold px-6 text-deep-orange-darken-4"
          @click="availabilityModal = true"
        >
          Solicitar Disponibilidad
        </v-btn>

        <!-- BOTÓN: CREAR HOJA DE SERVICIO (Solo Designador/Admin - Rol 1 o 3) -->
        <v-btn
          v-if="isDesignadorOrAdmin"
          color="primary"
          prepend-icon="mdi-file-plus"
          rounded="pill"
          class="px-8 font-weight-bold elevation-4 shadow-primary"
          @click="openCreateModal"
        >
          Crear Hoja de Servicio
        </v-btn>

        <!-- BOTÓN: ENVIAR DISPONIBILIDAD (Solo mientras la planilla esté pendiente) -->
        <v-btn
          v-if="pendingLinkedServices.length > 0"
          color="success"
          prepend-icon="mdi-calendar-check"
          rounded="pill"
          class="px-8 font-weight-bold elevation-4"
          style="box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4) !important;"
          @click="openAvailabilitySubmit"
        >
          Enviar Disponibilidad
        </v-btn>

      </header>

      <!-- SECCIÓN: SERVICIOS VINCULADOS (Para usuarios que deben enviar disponibilidad) -->
      <div v-if="hasLinkedServices" class="mb-12">
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
            <v-card rounded="xl" border flat class="pa-4 bg-white hover-elevate-soft" @click="openSubmitForService(linked)">
              <div class="d-flex flex-column flex-sm-row justify-space-between align-start mb-2 ga-2">
                <div class="flex-grow-1">
                  <div class="text-overline font-weight-black text-success line-height-1">
                    DISPONIBILIDAD SOLICITADA
                  </div>
                  <h3 class="text-h6 font-weight-black mb-1">
                    SVC {{ linked.svcNumber || '---' }} — {{ linked.month }} {{ linked.year }}
                  </h3>
                  <div v-if="linked.description" class="text-body-2 text-grey">{{ linked.description }}</div>
                </div>
                <v-chip
                  :color="hasSubmittedForService(linked.id) ? 'success' : 'amber-darken-2'"
                  size="small"
                  variant="flat"
                  class="font-weight-bold"
                >
                  {{ hasSubmittedForService(linked.id) ? 'ENVIADO' : 'PENDIENTE' }}
                </v-chip>
              </div>

              <div v-if="linked.shifts && linked.shifts.filter((s: any) => s).length > 0" class="d-flex ga-2 mt-2 mb-2">
                <v-chip
                  v-for="(shift, idx) in linked.shifts.filter((s: any) => s)"
                  :key="idx"
                  color="primary"
                  variant="tonal"
                  size="x-small"
                  class="font-weight-bold"
                >
                  {{ shift.start }} - {{ shift.end }}
                </v-chip>
              </div>

              <v-divider class="my-2"></v-divider>

              <v-btn
                v-if="linked.status === 'pending'"
                variant="flat"
                size="small"
                color="indigo-lighten-5"
                class="font-weight-bold text-none text-indigo-darken-3"
                block
              >
                {{ hasSubmittedForService(linked.id) ? 'Modificar disponibilidad' : 'Cargar disponibilidad' }}
                <v-icon class="ml-1">mdi-arrow-right</v-icon>
              </v-btn>
              <div v-else class="text-center py-2 text-success font-weight-black text-caption">
                <v-icon start size="16">mdi-check-circle-outline</v-icon> Planilla Confirmada - Recepción cerrada
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- SECCIÓN DE HOJAS DE SERVICIO (MIS HOJAS - Solo Designador/Admin) -->
      <div v-if="isDesignadorOrAdmin" class="mb-12">
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
              <div class="d-flex flex-column flex-lg-row justify-space-between align-start mb-3 ga-3">
                <div class="flex-grow-1">
                  <div class="text-overline font-weight-black text-primary line-height-1">COBERTURA {{ sheet.month }} {{ sheet.year }}</div>
                  <h3 class="text-h6 font-weight-black">{{ sheet.description || 'Sin descripción' }}</h3>
                </div>
                
                <div class="d-flex flex-wrap align-center ga-2 w-100 w-lg-auto">
                  <v-chip :color="getStatusColor(sheet.status)" size="small" variant="flat" class="font-weight-bold px-3">
                    {{ sheet.status === 'pending' ? 'PENDIENTE' : (sheet.status === 'confirmed' ? 'CONFIRMADO' : 'AUDITADO') }}
                  </v-chip>
                  
                  <!-- INDICADOR DE PERSONAS VINCULADAS -->
                  <v-chip
                    v-if="getLinkedEmailCount(sheet.id) > 0"
                    color="success"
                    variant="tonal"
                    size="x-small"
                    class="font-weight-bold"
                    prepend-icon="mdi-account-group"
                  >
                    {{ getLinkedEmailCount(sheet.id) }}
                  </v-chip>

                  <v-spacer class="d-none d-sm-block d-lg-none"></v-spacer>

                  <!-- BOTONES DE ACCIÓN (WRAP) -->
                  <div class="d-flex align-center ga-1 ml-auto ml-lg-0">
                    <v-btn
                      v-if="sheet.status === 'pending'"
                      size="x-small"
                      color="light-blue-lighten-4"
                      variant="flat"
                      class="font-weight-bold text-light-blue-darken-4"
                      style="border-radius: 0 !important;"
                      prepend-icon="mdi-check-decagram"
                      @click.stop="askConfirmDesignation(sheet)"
                    >
                      CONFIRMAR
                    </v-btn>
                    
                    <v-btn
                      v-if="sheet.status === 'pending'"
                      size="x-small"
                      variant="tonal"
                      color="secondary"
                      class="font-weight-bold"
                      icon="mdi-auto-fix"
                      @click.stop="handleAutocomplete(sheet)"
                      title="Autocompletar"
                    ></v-btn>
                    
                    <template v-if="sheet.status === 'pending'">
                      <v-btn icon="mdi-pencil" size="x-small" variant="tonal" color="primary" @click.stop="openEditModal(sheet)"></v-btn>
                      <v-btn icon="mdi-delete" size="x-small" variant="tonal" color="error" @click.stop="askDelete(sheet)"></v-btn>
                    </template>
                  </div>
                </div>
              </div>

              <div class="d-flex flex-column flex-sm-row ga-2 mt-2 mb-2">
                <v-btn 
                  v-for="idx in [0, 1, 2]" 
                  :key="idx"
                  @click.stop="openShiftModal(sheet, idx)"
                  variant="flat" 
                  color="success" 
                  size="x-small" 
                  rounded="pill"
                  class="flex-grow-1 font-weight-bold py-1"
                  style="min-height: 28px;"
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

      <!-- SECCIÓN DE AUDITORÍA ELIMINADA -->

      <!-- MODALES -->
      <ServiceSheetTemplate
        v-if="selectedSheet"
        :show="detailsModal"
        :sheet="selectedSheet"
        :availability="allAvailability"
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
        :sheets="sheets"
        @close="availabilityModal = false"
        @send="handleSendRequest"
      />

      <StaffAvailabilityModal
        :show="staffAvailabilityModal"
        :loading="loadingAvailability"
        :sheets="sheets"
        :availability-data="allAvailability"
        :linked-emails-map="linkedEmailsMap"
        @close="staffAvailabilityModal = false"
        @unlink="handleUnlinkUser"
      />

      <AvailabilitySubmitModal
        :show="submitAvailabilityModal"
        :loading="submittingAvailability"
        :service-data="selectedLinkedService"
        @close="submitAvailabilityModal = false"
        @submit="handleSubmitAvailability"
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

      <!-- MODAL CONFIRMACIÓN DESIGNACIÓN -->
      <v-dialog v-model="confirmDesignationDialog" max-width="450">
        <v-card rounded="xl" class="pa-6 text-center">
          <v-icon color="success" size="64" class="mb-4">mdi-check-decagram-outline</v-icon>
          <v-card-title class="text-h5 font-weight-black">¿Confirmar designaciones?</v-card-title>
          <v-card-text class="text-body-1 py-4">
            ¿Estás seguro que deseás confirmar esta acción y notificar al personal?<br>
            <strong>Esta acción publicará los turnos en la sección "Mis Turnos" de los usuarios designados.</strong>
          </v-card-text>
          <div class="d-flex ga-2 px-4 pb-4">
            <v-btn flex-grow-1 variant="tonal" color="grey" rounded="pill" @click="confirmDesignationDialog = false">
              Cancelar
            </v-btn>
            <v-btn flex-grow-1 color="success" rounded="pill" variant="elevated" class="font-weight-bold" @click="handleConfirmDesignation" :loading="confirming">
              Confirmar
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

      <!-- MODAL AVISO PLANILLA INCOMPLETA -->
      <v-dialog v-model="incompleteDialog" max-width="450">
        <v-card rounded="xl" class="pa-6 text-center">
          <v-icon color="warning" size="64" class="mb-4">mdi-alert-rhombus-outline</v-icon>
          <v-card-title class="text-h5 font-weight-black">Planilla Incompleta</v-card-title>
          <v-card-text class="text-body-1 py-4">
            No podés confirmar la planilla de <strong>{{ selectedSheet?.month }} (SVC {{ selectedSheet?.svcNumber }})</strong>.<br><br>
            Aún hay turnos sin cubrir en algunos días del mes. Por favor, completá todas las designaciones antes de finalizar.
          </v-card-text>
          <v-btn block color="warning" rounded="pill" variant="elevated" class="font-weight-bold" @click="incompleteDialog = false">
            Continuar editando
          </v-btn>
        </v-card>
      </v-dialog>

      <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="pill">
        {{ snackbarText }}
      </v-snackbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue'
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../plugins/firebase'
import { useAuthStore } from '../modules/auth/stores/authStore'
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
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
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
const linkedServices = ref<any[]>([]) // Servicios donde el usuario actual tiene email vinculado
const allAvailability = ref<any[]>([]) // Respuestas de disponibilidad
const linkedEmailsMap = ref<Record<string, string[]>>({}) // serviceId => emails
const mySubmissions = ref<any[]>([]) // Mis respuestas de disponibilidad
const selectedLinkedService = ref<any>(null)
const incompleteDialog = ref(false)
let unsubscribe: any = null
let unsubscribeLinked: any = null
let unsubscribeAvailability: any = null

const selectedShiftIdx = ref(0)
const tempShift = reactive({ start: '', end: '' })

// Roles: 1=Admin, 2=Alfita, 3=Designador, 4=Asignado
const isDesignadorOrAdmin = computed(() => {
  return authStore.userRole === 1 || authStore.userRole === 3
})

const hasLinkedServices = computed(() => {
  return visibleLinkedServices.value.length > 0
})

const visibleLinkedServices = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const monthNames = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ]

  return linkedServices.value.filter(s => {
    const sMonthIdx = monthNames.indexOf(s.month?.toUpperCase())
    const sYear = parseInt(s.year)
    if (isNaN(sYear) || sMonthIdx === -1) return true // Por seguridad si faltan datos
    
    if (sYear < currentYear) return false
    if (sYear === currentYear && sMonthIdx < currentMonth) return false
    return true
  })
})

const pendingLinkedServices = computed(() => {
  return visibleLinkedServices.value.filter(s => s.status === 'pending')
})

const getStatusColor = (status: string) => {
  if (status === 'pending') return 'amber-darken-2'
  if (status === 'confirmed') return 'success'
  return 'primary'
}

const hasSubmittedForService = (serviceId: string) => {
  return mySubmissions.value.some(s => s.serviceId === serviceId)
}

const getLinkedEmailCount = (serviceId: string) => {
  return linkedEmailsMap.value[serviceId]?.length || 0
}

// =============================================
// SOLICITAR DISPONIBILIDAD - Vincula correos al servicio en Firestore
// =============================================
const handleSendRequest = async (data: { emails: string[], message: string, serviceId: string }) => {
  sendingRequest.value = true
  try {
    // Guardar vinculación en Firestore
    // Cada email se almacena como un doc en la colección 'service_links'
    for (const email of data.emails) {
      await addDoc(collection(db, 'service_links'), {
        serviceId: data.serviceId,
        email: email,
        linkedBy: authStore.user!.uid,
        message: data.message,
        linkedAt: serverTimestamp(),
        active: true
      })
    }

    availabilityModal.value = false
    snackbarText.value = `Solicitud enviada a ${data.emails.length} persona${data.emails.length !== 1 ? 's' : ''}. Correos vinculados al servicio.`
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('Error enviando solicitud:', err)
    snackbarText.value = 'Error al enviar la solicitud'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    sendingRequest.value = false
  }
}

// =============================================
// ENVIAR DISPONIBILIDAD - El usuario carga sus días disponibles
// =============================================
const openAvailabilitySubmit = () => {
  if (linkedServices.value.length === 1) {
    selectedLinkedService.value = linkedServices.value[0]
    submitAvailabilityModal.value = true
  } else if (linkedServices.value.length > 1) {
    // Si hay varios servicios vinculados, abre el primero pendiente
    const pending = linkedServices.value.find(s => !hasSubmittedForService(s.id))
    selectedLinkedService.value = pending || linkedServices.value[0]
    submitAvailabilityModal.value = true
  }
}

const openSubmitForService = (service: any) => {
  selectedLinkedService.value = service
  submitAvailabilityModal.value = true
}

const handleSubmitAvailability = async (data: { days: number[], selections: any, notes: string }) => {
  if (!authStore.user || !selectedLinkedService.value) return
  submittingAvailability.value = true
  try {
    const userEmail = authStore.userData?.email || authStore.user.email || ''

    // Buscar si ya existe una submission para este servicio y usuario
    const existingQ = query(
      collection(db, 'availability_submissions'),
      where('serviceId', '==', selectedLinkedService.value.id),
      where('userId', '==', authStore.user.uid)
    )
    const existingSnap = await getDocs(existingQ)

    if (!existingSnap.empty) {
      // Actualizar existente
      const existingDoc = existingSnap.docs[0]
      await updateDoc(doc(db, 'availability_submissions', existingDoc.id), {
        days: data.days,
        selections: data.selections,
        notes: data.notes,
        userName: authStore.userData?.displayName || 'Usuario',
        hierarchy: authStore.userData?.hierarchy || '',
        updatedAt: serverTimestamp()
      })
    } else {
      // Crear nueva
      await addDoc(collection(db, 'availability_submissions'), {
        serviceId: selectedLinkedService.value.id,
        userId: authStore.user.uid,
        userEmail: userEmail,
        userName: authStore.userData?.displayName || 'Usuario',
        hierarchy: authStore.userData?.hierarchy || '',
        days: data.days,
        selections: data.selections,
        notes: data.notes,
        submittedAt: serverTimestamp()
      })
    }

    submitAvailabilityModal.value = false
    snackbarText.value = 'Tu disponibilidad fue enviada correctamente'
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('Error enviando disponibilidad:', err)
    snackbarText.value = 'Error al enviar disponibilidad'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    submittingAvailability.value = false
  }
}

// =============================================
// DESVINCULAR USUARIO de un servicio
// =============================================
const handleUnlinkUser = async (entry: any) => {
  try {
    // Eliminar el link del servicio
    const linksQ = query(
      collection(db, 'service_links'),
      where('serviceId', '==', entry.serviceId),
      where('email', '==', entry.userEmail)
    )
    const linksSnap = await getDocs(linksQ)
    for (const linkDoc of linksSnap.docs) {
      await deleteDoc(doc(db, 'service_links', linkDoc.id))
    }

    // Eliminar la submission de disponibilidad también
    const subQ = query(
      collection(db, 'availability_submissions'),
      where('serviceId', '==', entry.serviceId),
      where('userEmail', '==', entry.userEmail)
    )
    const subSnap = await getDocs(subQ)
    for (const subDoc of subSnap.docs) {
      await deleteDoc(doc(db, 'availability_submissions', subDoc.id))
    }

    snackbarText.value = `${entry.userEmail} fue desvinculado del servicio`
    snackbarColor.value = 'info'
    snackbar.value = true
  } catch (err) {
    console.error('Error desvinculando usuario:', err)
    snackbarText.value = 'Error al desvincular'
    snackbarColor.value = 'error'
    snackbar.value = true
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

const handleAutocomplete = async (sheet: any) => {
  if (!sheet) return
  
  snackbarText.value = 'Calculando asignaciones equitativas...'
  snackbarColor.value = 'info'
  snackbar.value = true
  
  try {
    // 1. Obtener todas las respuestas de disponibilidad para este servicio
    const qAvailability = query(
      collection(db, 'availability_submissions'),
      where('serviceId', '==', sheet.id)
    )
    const snap = await getDocs(qAvailability)
    const availabilityDocs = snap.docs.map(d => d.data())

    if (availabilityDocs.length === 0) {
      snackbarText.value = 'No hay respuestas de disponibilidad para este servicio.'
      snackbarColor.value = 'warning'
      snackbar.value = true
      return
    }

    // 2. Preparar pool de disponibilidad por (día-turno) y contador de usuarios
    const pool: Record<string, any[]> = {}
    const userEmails = [...new Set(availabilityDocs.map(d => d.userEmail))]
    const userCounts: Record<string, number> = {} 
    
    // Inicializar contadores
    userEmails.forEach(email => { userCounts[email] = 0 })

    availabilityDocs.forEach(doc => {
      if (doc.selections) {
        Object.entries(doc.selections).forEach(([day, shiftIdxs]) => {
          (shiftIdxs as number[]).forEach(sIdx => {
            const key = `${day}-${sIdx}`
            if (!pool[key]) pool[key] = []
            pool[key].push(doc)
          })
        })
      } else if (doc.days && doc.shiftIndexes) {
        // Compatibilidad con formato anterior
        doc.days.forEach((day: number) => {
          doc.shiftIndexes.forEach((sIdx: number) => {
            const key = `${day}-${sIdx}`
            if (!pool[key]) pool[key] = []
            pool[key].push(doc)
          })
        })
      }
    })

    // 3. Obtener info de días del mes
    const monthNames = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ]
    const monthIdx = monthNames.indexOf(sheet.month.toUpperCase())
    const year = sheet.year || new Date().getFullYear()
    const totalDays = new Date(year, monthIdx + 1, 0).getDate()
    const activeShiftsCount = (sheet.shifts || []).filter((s: any) => s !== null).length

    // 4. Algoritmo de asignación (Equitativo)
    const assignments: Record<string, Record<string, string>> = {}

    for (let d = 1; d <= totalDays; d++) {
      assignments[d.toString()] = {}
      for (let s = 0; s < activeShiftsCount; s++) {
        const key = `${d}-${s}`
        const candidates = [...(pool[key] || [])]
        
        if (candidates.length > 0) {
          // Ordenar candidatos por:
          // 1. Menor cantidad de asignaciones previas (equidad)
          // 2. Aleatoriedad (para desempatar)
          candidates.sort((a, b) => {
            const countA = userCounts[a.userEmail] || 0
            const countB = userCounts[b.userEmail] || 0
            if (countA !== countB) return countA - countB
            return Math.random() - 0.5
          })
          
          const chosen = candidates[0]
          // Guardamos Jerarquía + Nombre Completo para la planilla
          const identity = `${chosen.hierarchy || ''} ${chosen.userName || chosen.userEmail}`.trim()
          assignments[d.toString()][s.toString()] = identity
          userCounts[chosen.userEmail]++
        }
      }
    }

    // 5. Guardar en Firestore
    await updateDoc(doc(db, 'servicios', sheet.id), {
      assignments: assignments,
      status: 'pending', 
      updatedAt: serverTimestamp()
    })

    snackbarText.value = '¡Planilla autocompletada con éxito!'
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('[Autocomplete] Error:', err)
    snackbarText.value = 'Error al ejecutar el autocompletado'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

// =============================================
// CARGAR DATOS INICIALES
// =============================================
onMounted(() => {
  if (!authStore.user) return
  const currentUserEmail = authStore.userData?.email || authStore.user.email || ''

  // 1. Cargar mis hojas de servicio (para Designador/Admin)
  if (isDesignadorOrAdmin.value) {
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

      // Recargar linkedEmailsMap con los service IDs propios
      loadLinkedEmailsMap()
    })

    // Cargar disponibilidad recibida (para ver en el panel)
    unsubscribeAvailability = onSnapshot(
      collection(db, 'availability_submissions'),
      (snap) => {
        allAvailability.value = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
      }
    )
  } else {
    loadingSheets.value = false
  }

  // 2. Cargar servicios vinculados a mi email (para cualquier usuario)
  if (currentUserEmail) {
    const linkedQ = query(
      collection(db, 'service_links'),
      where('email', '==', currentUserEmail),
      where('active', '==', true)
    )
    
    unsubscribeLinked = onSnapshot(linkedQ, async (snap) => {
      const serviceIds = [...new Set(snap.docs.map(d => d.data().serviceId))]
      
      // Cargar los datos de cada servicio vinculado
      const services: any[] = []
      for (const serviceId of serviceIds) {
        try {
          const { getDoc } = await import('firebase/firestore')
          const serviceDoc = await getDoc(doc(db, 'servicios', serviceId))
          if (serviceDoc.exists()) {
            services.push({ id: serviceDoc.id, ...serviceDoc.data() })
          }
        } catch (err) {
          console.warn('No se pudo cargar el servicio:', serviceId, err)
        }
      }
      linkedServices.value = services
    })

    // Cargar mis submissions de disponibilidad
    const mySubQ = query(
      collection(db, 'availability_submissions'),
      where('userId', '==', authStore.user.uid)
    )
    onSnapshot(mySubQ, (snap) => {
      mySubmissions.value = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
    })
  }
})

// Cargar mapa de emails vinculados por servicio
const loadLinkedEmailsMap = async () => {
  try {
    const linksSnap = await getDocs(
      query(collection(db, 'service_links'), where('linkedBy', '==', authStore.user!.uid), where('active', '==', true))
    )
    const map: Record<string, string[]> = {}
    linksSnap.docs.forEach(d => {
      const data = d.data()
      if (!map[data.serviceId]) map[data.serviceId] = []
      if (!map[data.serviceId].includes(data.email)) {
        map[data.serviceId].push(data.email)
      }
    })
    linkedEmailsMap.value = map
  } catch (err) {
    console.warn('Error cargando linked emails:', err)
  }
}

const isSheetFullyCovered = (sheet: any) => {
  if (!sheet || !sheet.shifts || !sheet.assignments) return false
  
  // 1. Obtener días del mes
  const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']
  const mIdx = months.indexOf(sheet.month?.toUpperCase())
  if (mIdx === -1) return false
  const dCount = new Date(parseInt(sheet.year), mIdx + 1, 0).getDate()
  
  // 2. Obtener índices de turnos activos (no nulos)
  const activeShiftIndices = sheet.shifts.map((s: any, i: number) => s !== null ? i : -1).filter((i: number) => i !== -1)
  if (activeShiftIndices.length === 0) return true // Planilla sin turnos (teórico)
  
  // 3. Revisar cada día y cada turno activo
  for (let d = 1; d <= dCount; d++) {
    const dayAssignments = sheet.assignments[d] || {}
    for (const sIdx of activeShiftIndices) {
      const assigned = dayAssignments[sIdx]
      if (!assigned || String(assigned).trim() === '') {
        return false // Falta un turno
      }
    }
  }
  
  return true
}

const askConfirmDesignation = (sheet: any) => {
  selectedSheet.value = sheet
  
  if (!isSheetFullyCovered(sheet)) {
    incompleteDialog.value = true
    return
  }
  
  confirmDesignationDialog.value = true
}

const handleConfirmDesignation = async () => {
  if (!selectedSheet.value) return
  confirming.value = true
  try {
    await updateDoc(doc(db, 'servicios', selectedSheet.value.id), {
      status: 'confirmed',
      published: true,
      publishedAt: serverTimestamp()
    })
    
    confirmDesignationDialog.value = false
    snackbarText.value = 'Designaciones confirmadas y personal notificado'
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('Error confirmando designación:', err)
    snackbarText.value = 'Error al confirmar'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    confirming.value = false
  }
}

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  if (unsubscribeLinked) unsubscribeLinked()
  if (unsubscribeAvailability) unsubscribeAvailability()
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
