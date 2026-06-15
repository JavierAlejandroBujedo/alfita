<template>
  <v-dialog :model-value="show" fullscreen transition="dialog-bottom-transition">
    <v-card class="bg-grey-lighten-4">
      <!-- BARRA DE ACCIONES -->
      <v-toolbar color="primary" flat>
        <v-btn icon="mdi-close" @click="$emit('close')" color="white"></v-btn>
        <v-toolbar-title class="text-white font-weight-bold">Vista Previa de Planilla</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          prepend-icon="mdi-printer"
          variant="elevated"
          color="white"
          class="mr-2 text-primary font-weight-bold"
          @click="printSheet"
        >
          Imprimir
        </v-btn>
        <v-btn
          prepend-icon="mdi-share-variant"
          variant="elevated"
          color="white"
          class="mr-4 text-primary font-weight-bold"
          @click="shareSheet"
        >
          Compartir
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-0 d-flex justify-center bg-grey-lighten-4">
        <!-- PLANILLA ESTILO EXCEL BOXED -->
        <v-card rounded="0" class="service-sheet pa-10 my-8 mx-auto bg-white" width="1122">
          <div class="print-container">
            
            <!-- CABECERA -->
            <div class="header-section text-center mb-6">
              <h1 class="text-h4 font-weight-black text-uppercase mb-2">
                PLANILLA DE COBERTURA DE SERVICIOS
              </h1>
              <div class="d-flex justify-center align-center">
                <span class="text-h6 font-weight-bold border-black px-6 py-1 text-uppercase bg-grey-lighten-3">
                  CORRESPONDIENTE AL MES DE {{ sheet.month }} DE {{ sheet.year }}
                </span>
              </div>
            </div>

            <!-- DATOS ENTIDAD (NUEVO CONTENEDOR) -->
            <div class="entity-box pa-3 mb-4 bg-grey-lighten-5 border-black">
              <div class="text-overline font-weight-black mb-2 border-b-black d-flex justify-space-between">
                <span>DATOS DE LA ENTIDAD</span>
                <span class="text-primary">SVC Nº: {{ sheet.svcNumber || '---' }}</span>
              </div>
              <div class="info-grid">
                <div class="grid-column">
                  <div class="field-row mb-1">
                    <span class="label">ENTIDAD:</span>
                    <span class="value box">{{ sheet.entidad || '---' }}</span>
                  </div>
                  <div class="field-row mb-1">
                    <span class="label">DOMICILIO:</span>
                    <span class="value box">{{ sheet.domicilio || '---' }}</span>
                    <span class="label ml-2">Nº:</span>
                    <span class="value box" style="max-width: 80px">{{ sheet.nroDomicilio || '---' }}</span>
                  </div>
                  <div class="field-row mb-1">
                    <span class="label">BARRIO:</span>
                    <span class="value box">{{ sheet.barrio || '---' }}</span>
                  </div>
                </div>
                <div class="grid-column">
                  <div class="field-row mb-1">
                    <span class="label">REFERENTE:</span>
                    <span class="value box">{{ sheet.referente || '---' }}</span>
                  </div>
                  <div class="field-row mb-1">
                    <span class="label">TELÉFONO:</span>
                    <span class="value box">{{ sheet.telefonoReferente || sheet.telefonoEntidad || '---' }}</span>
                  </div>
                  <div class="field-row mb-1">
                    <span class="label">COMISARIA:</span>
                    <span class="value box">{{ sheet.comisaria || '---' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- DATOS PERSONAL ENCARGADO -->
            <div class="personal-box pa-3 mb-6 bg-grey-lighten-4 border-black">
              <div class="text-overline font-weight-black mb-2 border-b-black">DATOS DEL PERSONAL ENCARGADO</div>
              <div class="info-grid">
                <div class="grid-column">
                  <div class="field-row mb-1">
                    <span class="label">POLICIA ENCARGADO:</span>
                    <span class="value box font-weight-black text-uppercase villa-style">{{ sheet.jerarquia }} {{ sheet.policiaEncargado }}</span>
                  </div>
                  <div class="field-row mb-1">
                    <span class="label">D.N.I.:</span>
                    <span class="value box">{{ sheet.dni }}</span>
                  </div>
                </div>
                <div class="grid-column">
                  <div class="field-row mb-1">
                    <span class="label">TELÉFONO:</span>
                    <span class="value box">{{ sheet.telefonoPersona }}</span>
                  </div>
                  <div class="field-row mb-1">
                    <span class="label">LUGAR REVISTA:</span>
                    <span class="value box">{{ sheet.lugarRevista || '---' }}</span>
                  </div>
                </div>
              </div>
              <div class="field-row mt-1">
                <span class="label">E-MAIL:</span>
                <span class="value box">{{ sheet.email }}</span>
              </div>
            </div>

            <!-- TABLA DE DÍAS -->
            <div class="table-content">
              <table class="w-100 border-collapse border-black-thick">
                <thead>
                  <tr class="bg-grey-lighten-2 text-center font-weight-black">
                    <th class="border-black pa-1" style="width: 100px">DÍA</th>
                    <th class="border-black pa-1" style="width: 50px">Nº</th>
                    <!-- COLUMNAS DINÁMICAS DE TURNOS -->
                    <th 
                      v-for="(shift, sIdx) in activeShifts" 
                      :key="sIdx"
                      class="border-black pa-1 text-uppercase"
                    >
                      TURNO: {{ shift.start }} - {{ shift.end }}
                    </th>
                    <!-- Si no hay turnos, mostrar uno vacío para mantener estructura -->
                    <th v-if="activeShifts.length === 0" class="border-black pa-1">HORARIO NO DEFINIDO</th>
                  </tr>
                </thead>
                <tbody>
                    <tr v-for="day in daysInMonth" :key="day.dayNum" class="text-center">
                      <td class="border-black pa-1 font-weight-bold bg-grey-lighten-4 text-uppercase small-text">{{ day.dayName }}</td>
                      <td class="border-black pa-1 font-weight-black">{{ day.dayNum }}</td>
                      
                      <td 
                        v-for="(_, sIdx) in activeShifts" 
                        :key="sIdx" 
                        class="border-black pa-1 assignment-cell text-uppercase font-weight-bold interactive-cell"
                        :class="{ 'editing': isDesignadorOrAdmin }"
                      >
                        <!-- MENU PARA CAMBIAR ASIGNACIÓN -->
                        <v-menu v-if="isDesignadorOrAdmin" activator="parent" location="bottom center" transition="scale-transition">
                          <v-list density="compact" rounded="lg" elevation="10" border max-height="300">
                            <v-list-subheader class="font-weight-black text-primary">PERSONAS DISPONIBLES (DÍA {{ day.dayNum }} T{{ Number(sIdx)+1 }})</v-list-subheader>
                            
                            <v-list-item v-if="getAvailableUsers(day.dayNum, Number(sIdx)).length === 0">
                              <v-list-item-title class="text-grey text-caption italic">Nadie envió disponibilidad para este día</v-list-item-title>
                            </v-list-item>
                            
                            <v-list-item 
                              v-for="user in getAvailableUsers(day.dayNum, Number(sIdx))" 
                              :key="user.userId"
                              @click="setAssignment(day.dayNum, Number(sIdx), user)"
                              :active="getAssignment(day.dayNum, Number(sIdx)) === formatIdentity(user)"
                              color="primary"
                            >
                              <template v-slot:prepend>
                                <v-icon size="18" color="success">mdi-account-check</v-icon>
                              </template>
                              <v-list-item-title class="text-body-2 font-weight-bold">
                                {{ user.hierarchy }} {{ user.userName }}
                              </v-list-item-title>
                            </v-list-item>

                            <v-divider class="my-1"></v-divider>
                            <v-list-item @click="setAssignment(day.dayNum, Number(sIdx), null)">
                              <template v-slot:prepend>
                                <v-icon size="18" color="error">mdi-close-circle-outline</v-icon>
                              </template>
                              <v-list-item-title class="text-body-2 text-error font-weight-bold">Quitar asignación</v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-menu>

                        {{ getAssignment(day.dayNum, Number(sIdx)) }}
                      </td>
                      <!-- Celda vacía si no hay turnos -->
                      <td v-if="activeShifts.length === 0" class="border-black pa-1"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="pill" location="top">
                {{ snackbarText }}
              </v-snackbar>

            <!-- PIE DE PLANILLA -->
            <div class="footer-area mt-6">
              <div class="field-row mb-8">
                <span class="label">OBSERVACIONES:</span>
                <span class="value box min-h-120">{{ sheet.description || '---' }}</span>
              </div>

              <div class="d-flex justify-space-around mt-12 pt-12">
                <div class="sig-container">
                  <div class="sig-line"></div>
                  <div class="text-center font-weight-bold small-text text-uppercase">Firma y Sello de la Entidad</div>
                </div>
                <div class="sig-container">
                  <div class="sig-line"></div>
                  <div class="text-center font-weight-bold small-text text-uppercase">Firma y Sello del Policía</div>
                </div>
              </div>
            </div>

          </div>
        </v-card>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../plugins/firebase'
import { useAuthStore } from '../modules/auth/stores/authStore'

const props = defineProps<{
  show: boolean
  sheet: any
  availability?: any[]
}>()

defineEmits(['close'])

const authStore = useAuthStore()

// Mensajes y feedback
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Estado local para reactividad inmediata
const localAssignments = ref<Record<string, Record<string, string>>>({})

watch(() => props.sheet.assignments, (newVal) => {
  if (newVal) localAssignments.value = JSON.parse(JSON.stringify(newVal))
}, { deep: true, immediate: true })

const isDesignadorOrAdmin = computed(() => {
  return authStore.userRole === 1 || authStore.userRole === 3
})

const daysInMonth = computed(() => {
  if (!props.sheet) return []
  
  const monthNames = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ]
  
  const monthIndex = monthNames.indexOf(props.sheet.month.toUpperCase())
  const year = props.sheet.year
  const date = new Date(year, monthIndex, 1)
  const days = []
  
  while (date.getMonth() === monthIndex) {
    days.push({
      dayNum: date.getDate(),
      dayName: date.toLocaleDateString('es-AR', { weekday: 'long' }),
      date: new Date(date)
    })
    date.setDate(date.getDate() + 1)
  }
  
  return days
})

const activeShifts = computed(() => {
  return (props.sheet.shifts || []).filter((s: any) => s !== null)
})

const printSheet = () => {
  window.print()
}

const getAssignment = (dayNum: number, shiftIdx: number) => {
  const day = localAssignments.value[dayNum.toString()]
  if (!day) return ''
  return day[shiftIdx.toString()] || ''
}

const getAvailableUsers = (day: number, shiftIdx: number) => {
  if (!props.availability) return []
  return props.availability.filter(a => {
    if (a.serviceId !== props.sheet.id) return false
    if (a.selections) {
       return a.selections[day.toString()]?.includes(shiftIdx)
    }
    // backward compat
    return (a.days || []).includes(day) && (a.shiftIndexes || []).includes(shiftIdx)
  })
}

const formatIdentity = (user: any) => {
  return `${user.hierarchy || ''} ${user.userName || user.userEmail}`.trim()
}

const setAssignment = async (day: number, shiftIdx: number, user: any | null) => {
  if (!props.sheet?.id) return
  
  try {
    if (!localAssignments.value[day.toString()]) {
      localAssignments.value[day.toString()] = {}
    }
    
    const identity = user ? formatIdentity(user) : ''
    if (identity) {
      localAssignments.value[day.toString()][shiftIdx.toString()] = identity
    } else {
      delete localAssignments.value[day.toString()][shiftIdx.toString()]
    }

    // Actualizar Firestore en segundo plano
    const firestoreAssignments = JSON.parse(JSON.stringify(localAssignments.value))
    await updateDoc(doc(db, 'servicios', props.sheet.id), {
      assignments: firestoreAssignments
    })
    
    snackbarText.value = user ? `Asignado a ${user.userName}` : 'Asignación quitada'
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('[Template] Error al asignar:', err)
    snackbarText.value = 'Error al actualizar asignación'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

const shareSheet = async () => {
  const url = `${window.location.origin}/hoja-de-servicio/${props.sheet.id}`
  try {
    await navigator.clipboard.writeText(url)
    snackbarText.value = '¡Enlace de planilla copiado!'
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('Error al copiar enlace:', err)
  }
}
</script>

<style scoped>
.service-sheet {
  box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important;
  color: #000 !important;
  border: 1px solid #000;
}

.service-sheet * {
  color: #000 !important;
}

.border-black { border: 1px solid #000 !important; }
.border-black-thick { border: 2px solid #000 !important; }
.border-b-black { border-bottom: 1px solid #000 !important; }

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.field-row {
  display: flex;
  align-items: center;
}

.label {
  font-weight: 800;
  font-size: 0.85rem;
  margin-right: 8px;
  white-space: nowrap;
}

.value.box {
  flex-grow: 1;
  border: 1px solid #000;
  padding: 4px 10px;
  min-height: 30px;
  font-size: 0.9rem;
}

.min-h-120 { min-height: 120px !important; }

.villa-style {
  font-family: 'Google Sans', sans-serif !important;
  font-weight: 900 !important;
  letter-spacing: 0.5px;
}

.small-text { font-size: 0.7rem; }
.assignment-cell { font-size: 0.75rem; color: #000; min-width: 150px; }

.interactive-cell.editing {
  cursor: pointer;
  transition: background-color 0.2s;
}

.interactive-cell.editing:hover {
  background-color: #e3f2fd !important;
}

.sig-container { width: 250px; }
.sig-line { border-top: 1.5px solid #000; margin-bottom: 5px; }

@media print {
  .v-toolbar, .v-btn, .v-snackbar { display: none !important; }
  .service-sheet { box-shadow: none !important; margin: 0 !important; padding: 20px !important; width: 100% !important; border: none !important; }
  body, .bg-grey-lighten-4 { background-color: white !important; }
}
</style>
