<template>
  <v-dialog :model-value="show" fullscreen transition="dialog-bottom-transition">
    <v-card class="bg-grey-lighten-4">
      <!-- BARRA DE ACCIONES -->
      <v-toolbar color="primary" flat>
        <v-btn icon="mdi-close" @click="$emit('close')" color="white"></v-btn>
        <v-toolbar-title class="text-white font-weight-bold">Vista Previa de Planilla</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          v-if="isDesignadorOrAdmin"
          prepend-icon="mdi-auto-fix"
          variant="elevated"
          color="amber-darken-3"
          class="mr-2 font-weight-bold"
          :loading="autoFilling"
          @click="startAutoFill"
        >
          Autocompletar
        </v-btn>
        <v-btn
          prepend-icon="mdi-file-document-outline"
          variant="elevated"
          color="indigo-darken-2"
          class="mr-2 font-weight-bold"
          @click="showSummary = !showSummary"
        >
          {{ showSummary ? 'Ver Planilla' : 'Resumen' }}
        </v-btn>

        <v-btn
          prepend-icon="mdi-printer"
          variant="elevated"
          color="white"
          class="mr-4 text-primary font-weight-bold"
          :loading="printing"
          @click="printSheet"
        >
          Imprimir
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-0 bg-grey-lighten-4 sheet-scroll-wrapper">
        <!-- PLANILLA ESTILO EXCEL BOXED -->
        <div class="sheet-outer-centering">
        <v-card v-show="!showSummary" id="front-sheet" rounded="0" class="service-sheet px-4 px-md-8 py-6 py-md-8 my-4 my-md-8 mx-auto bg-white">
          <div class="print-container">
            
            <!-- CABECERA -->
            <div class="header-section text-center pt-2 mb-2" style="position: relative;">
              <div class="province-label">
                <div>POLICÍA DE LA PROVINCIA</div>
                <div>CÓRDOBA</div>
              </div>
              <div class="division-label">DIVISIÓN POLICÍA ADICIONAL</div>
              <h1 class="font-weight-black text-uppercase mb-1" style="font-size: 18px !important; line-height: 1.1;">
                PLANILLA DE COBERTURA DE SERVICIOS
              </h1>
              <div class="d-flex justify-center align-center">
                <span class="font-weight-bold border-black px-4 py-0.5 text-uppercase bg-grey-lighten-3" style="font-size: 12px !important;">
                  CORRESPONDIENTE AL MES DE {{ sheet.month }} DE {{ sheet.year }}
                </span>
              </div>
            </div>
          
            <!-- DATOS ENTIDAD (NUEVO CONTENEDOR) -->
            <div class="entity-box pa-2 mb-2 bg-grey-lighten-5 border-black">
              <div class="text-overline font-weight-black mb-1 border-b-black d-flex justify-space-between" style="font-size: 0.65rem !important; line-height: 1.2;">
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
            <div class="personal-box pa-2 mb-2 bg-grey-lighten-4 border-black">
              <div class="text-overline font-weight-black mb-1 border-b-black" style="font-size: 0.65rem !important; line-height: 1.2;">DATOS DEL PERSONAL ENCARGADO</div>
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
            <div class="table-content grid-compact">
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
                      HORARIO: {{ shift.start }} - {{ shift.end }}
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
          </div>
        </v-card>

        <!-- PLANILLA DORSO: RESUMEN DE SERVICIOS ASIGNADOS -->
        <v-card v-show="showSummary" id="back-sheet" rounded="0" class="service-sheet sheet-portrait-width px-4 px-md-8 py-5 py-md-6 my-4 my-md-8 mx-auto bg-white">
          <div class="print-container">
            <!-- CABECERA DORSO -->
            <div class="header-section text-center mb-6">
              <h2 class="text-h5 font-weight-black text-uppercase mb-6 text-decoration-underline" style="letter-spacing: 1px;">
                RESUMEN DE SERVICIOS ASIGNADOS
              </h2>
            </div>

            <!-- GRILLAS DE RESUMEN (UNA POR TURNO) -->
            <div v-for="(shift, sIdx) in activeShifts" :key="sIdx" class="mb-6 table-content grid-compact">
              <table class="w-100 border-collapse border-black-thick summary-table">
                <thead>
                  <tr class="bg-grey-lighten-2 text-center font-weight-black">
                    <th colspan="4" class="border-black pa-2 py-2 text-uppercase text-caption font-weight-bold">
                      Días asignados {{ Number(sIdx) + 1 }}º Horario: {{ shift.start }} a {{ shift.end }}
                    </th>
                  </tr>
                  <tr class="bg-grey-lighten-4 text-center font-weight-black">
                    <th class="border-black pa-1 text-caption font-weight-bold" style="width: 40%">Apellido y Nombres</th>
                    <th class="border-black pa-1 text-caption font-weight-bold" style="width: 20%">D.N.I.</th>
                    <th class="border-black pa-1 text-caption font-weight-bold" style="width: 25%">Días asignados</th>
                    <th class="border-black pa-1 text-caption font-weight-bold" style="width: 15%">Notificación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in getUsersForShift(Number(sIdx))" :key="user.userId" class="text-center animate-row">
                    <td class="border-black pa-1 px-3 text-left font-weight-medium text-uppercase text-caption">
                      {{ user.hierarchy }} {{ user.displayName }}
                    </td>
                    <td class="border-black pa-1 font-weight-black text-caption">
                      {{ user.dni }}
                    </td>
                    <td 
                      class="border-black pa-1 font-weight-bold text-caption"
                      :class="{ 'empty-assigned-cell': getUserAssignedDaysForShift(user.userId, Number(sIdx)).length === 0 }"
                    >
                      {{ getUserAssignedDaysForShift(user.userId, Number(sIdx)).join('-') }}
                    </td>
                    <td class="border-black pa-1"></td>
                  </tr>
                  <tr v-if="getUsersForShift(Number(sIdx)).length === 0">
                    <td colspan="4" class="border-black pa-4 text-center text-grey italic text-caption">
                      No hay personal asignado a este horario.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- FIRMA DEL DESIGNADOR -->
            <div class="signature-section text-right mt-10">
              <div class="signature-line-wrapper d-inline-block text-center mr-6" style="width: 280px;">
                <div class="mb-2" style="height: 60px; border-bottom: 2px solid #000 !important;"></div>
                <div class="font-weight-black text-caption text-uppercase">{{ sheet.jerarquia }} {{ sheet.policiaEncargado }}</div>
                <div class="text-caption text-grey text-uppercase" style="font-size: 0.65rem !important;">{{ sheet.lugarRevista || 'DESIGNADOR DEL SERVICIO' }}</div>
              </div>
            </div>

          </div>
        </v-card>

        </div>
        <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="pill" location="top">
          {{ snackbarText }}
        </v-snackbar>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- DIÁLOGO AUTOCOMPLETAR -->
  <v-dialog v-model="autoFillDialog" max-width="500" persistent>
    <v-card rounded="xl" class="pa-6">
      <v-icon color="amber-darken-3" size="48" class="mb-3 d-block mx-auto">mdi-auto-fix</v-icon>
      <v-card-title class="text-h6 font-weight-bold text-center pb-2">Autocompletar Planilla</v-card-title>
      <v-card-text class="text-body-2 text-center text-grey-darken-1 pb-4">
        El sistema asignará equitativamente las disponibilidades enviadas entre los turnos libres.
        <br><br>
        <strong>No duplicará</strong> a ningún usuario en el mismo turno/día en otras hojas del mismo servicio.
        <br><br>
        <v-chip color="amber-darken-3" variant="tonal" size="small" class="font-weight-bold">
          {{ autoFillStats.available }} personas disponibles | {{ autoFillStats.empty }} celdas vacías
        </v-chip>
      </v-card-text>
      <v-card-actions class="justify-center ga-3">
        <v-btn variant="text" color="grey" @click="autoFillDialog = false">Cancelar</v-btn>
        <v-btn color="amber-darken-3" variant="flat" rounded="pill" class="px-8 font-weight-bold" @click="confirmAutoFill" :loading="autoFilling">Confirmar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { doc, updateDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore'
import { db } from '../plugins/firebase'
import { useAuthStore } from '../modules/auth/stores/authStore'
import html2canvas from 'html2canvas'

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
const autoFilling = ref(false)
const autoFillDialog = ref(false)
const autoFillStats = ref({ available: 0, empty: 0 })
const printing = ref(false)

// Estado local para reactividad inmediata
const localAssignments = ref<Record<string, Record<string, string>>>({})

watch(() => props.sheet.assignments, (newVal) => {
  if (newVal) localAssignments.value = JSON.parse(JSON.stringify(newVal))
}, { deep: true, immediate: true })

// ─── RESUMEN (DORSO) ─────────────────────────────────────────────────────────
const showSummary = ref(false)
const userProfiles = ref<Record<string, { hierarchy: string, displayName: string, dni: string, email: string }>>({})

const fetchUserProfiles = async () => {
  if (!props.availability || props.availability.length === 0 || !props.sheet?.id) return
  
  const userIds = Array.from(new Set(
    props.availability
      .filter(a => a.serviceId === props.sheet?.id)
      .map(a => a.userId)
      .filter(Boolean)
  ))
  
  if (userIds.length === 0) return

  try {
    const profiles: Record<string, any> = {}
    await Promise.all(userIds.map(async (uid) => {
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        const u = userSnap.data()
        profiles[uid] = {
          hierarchy: u.hierarchy || '',
          displayName: u.displayName || 'Usuario',
          dni: u.dni || '---',
          email: u.email || ''
        }
      } else {
        const av = props.availability?.find(a => a.userId === uid)
        profiles[uid] = {
          hierarchy: av?.hierarchy || '',
          displayName: av?.userName || 'Desconocido',
          dni: av?.dni || '---',
          email: av?.userEmail || ''
        }
      }
    }))
    userProfiles.value = profiles
  } catch (err) {
    console.error('Error fetching user profiles:', err)
  }
}

watch(() => props.show, (isVisible) => {
  if (isVisible) {
    showSummary.value = false
    fetchUserProfiles()
  }
}, { immediate: true })

watch(() => props.availability, () => {
  if (props.show) {
    fetchUserProfiles()
  }
}, { deep: true })

const uniqueAvailableUsers = computed(() => {
  if (!props.availability || !props.sheet) return []
  
  const serviceAvails = props.availability.filter(a => a.serviceId === props.sheet.id)
  const seenIds = new Set<string>()
  const list: any[] = []
  
  serviceAvails.forEach(a => {
    if (a.userId && !seenIds.has(a.userId)) {
      seenIds.add(a.userId)
      const profile = userProfiles.value[a.userId]
      list.push({
        userId: a.userId,
        hierarchy: profile?.hierarchy || a.hierarchy || '',
        displayName: profile?.displayName || a.userName || 'Usuario',
        dni: profile?.dni || a.dni || '---',
        email: profile?.email || a.userEmail || ''
      })
    }
  })
  
  return list.sort((a, b) => a.displayName.localeCompare(b.displayName, 'es'))
})

const getUserAssignedDaysForShift = (userId: string, shiftIdx: number) => {
  if (!props.availability || !props.sheet) return []
  const av = props.availability.find(a => a.serviceId === props.sheet.id && a.userId === userId)
  if (!av) return []
  const identity = formatIdentity(av)
  
  const assignedDays: number[] = []
  Object.entries(localAssignments.value).forEach(([dayStr, shifts]) => {
    if (shifts[shiftIdx.toString()] === identity) {
      assignedDays.push(parseInt(dayStr))
    }
  })
  
  return assignedDays.sort((a, b) => a - b)
}

const getUsersForShift = (shiftIdx: number) => {
  return uniqueAvailableUsers.value.filter(user => {
    return getUserAssignedDaysForShift(user.userId, shiftIdx).length > 0
  })
}

const isDesignadorOrAdmin = computed(() => {
  return authStore.userRole === 1 || authStore.userRole === 2
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

const printSheet = async () => {
  const frontCard = document.getElementById('front-sheet')
  const backCard = document.getElementById('back-sheet')
  if (!frontCard || !backCard) return

  // 1. Abrir ventana popup de manera 100% sincrónica para evitar bloqueos en celulares
  const win = window.open('', '_blank')
  if (!win) {
    snackbarText.value = 'El navegador bloqueó la ventana de impresión. Permití los popups.'
    snackbarColor.value = 'warning'
    snackbar.value = true
    return
  }

  // Escribir contenido temporal de carga en el popup
  win.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Preparando planilla de cobertura...</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #ffffff;
            color: #424242;
          }
          .spinner {
            border: 4px solid rgba(0,0,0,0.1);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border-left-color: #00897b;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="spinner"></div>
        <div style="font-size: 16px; font-weight: 500;">Generando vista de impresión...</div>
      </body>
    </html>
  `)
  win.document.close()

  printing.value = true

  // Respaldar estados iniciales de visualización y maquetación
  const frontWasHidden = frontCard.style.display === 'none'
  const backWasHidden = backCard.style.display === 'none'

  const savedFrontPosition = frontCard.style.position
  const savedFrontTop = frontCard.style.top
  const savedFrontLeft = frontCard.style.left
  const savedFrontWidth = frontCard.style.width
  const savedFrontMaxWidth = frontCard.style.maxWidth

  const savedBackPosition = backCard.style.position
  const savedBackTop = backCard.style.top
  const savedBackLeft = backCard.style.left
  const savedBackWidth = backCard.style.width
  const savedBackMaxWidth = backCard.style.maxWidth

  // Forzar maquetación portrait fija a 800px fuera de la pantalla durante la captura
  frontCard.style.position = 'fixed'
  frontCard.style.top = '-99999px'
  frontCard.style.left = '-99999px'
  frontCard.style.display = 'block'
  frontCard.style.visibility = 'visible'
  frontCard.style.width = '800px'
  frontCard.style.maxWidth = '800px'

  backCard.style.position = 'fixed'
  backCard.style.top = '-99999px'
  backCard.style.left = '-99999px'
  backCard.style.display = 'block'
  backCard.style.visibility = 'visible'
  backCard.style.width = '800px'
  backCard.style.maxWidth = '800px'

  // Agregar clase temporaria para aplicar compresión vertical de impresión
  frontCard.classList.add('printing-layout')
  backCard.classList.add('printing-layout')

  try {
    // Esperar repintado del DOM
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 350))

    const frontEl = frontCard.querySelector('.print-container') as HTMLElement | null
    const backEl = backCard.querySelector('.print-container') as HTMLElement | null
    if (!frontEl || !backEl) throw new Error('Contenedor de impresión ausente')

    // Hacer visible justo antes de capturar
    frontCard.style.visibility = ''
    backCard.style.visibility = ''

    // Reiniciar temporalmente el scroll del contenedor principal para Capturar completo
    const scrollWrapper = document.querySelector('.sheet-scroll-wrapper')
    const originalScrollTop = scrollWrapper ? scrollWrapper.scrollTop : 0
    const originalScrollLeft = scrollWrapper ? scrollWrapper.scrollLeft : 0
    if (scrollWrapper) {
      scrollWrapper.scrollTop = 0
      scrollWrapper.scrollLeft = 0
    }

    // Captura Frente
    const canvasFront = await html2canvas(frontEl, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1200
    })

    // Captura Dorso
    const canvasBack = await html2canvas(backEl, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1200
    })

    // Restaurar scroll
    if (scrollWrapper) {
      scrollWrapper.scrollTop = originalScrollTop
      scrollWrapper.scrollLeft = originalScrollLeft
    }

    // Restaurar maquetación en la pantalla original
    frontCard.classList.remove('printing-layout')
    backCard.classList.remove('printing-layout')

    frontCard.style.display = frontWasHidden ? 'none' : ''
    frontCard.style.visibility = ''
    frontCard.style.position = savedFrontPosition
    frontCard.style.top = savedFrontTop
    frontCard.style.left = savedFrontLeft
    frontCard.style.width = savedFrontWidth
    frontCard.style.maxWidth = savedFrontMaxWidth

    backCard.style.display = backWasHidden ? 'none' : ''
    backCard.style.visibility = ''
    backCard.style.position = savedBackPosition
    backCard.style.top = savedBackTop
    backCard.style.left = savedBackLeft
    backCard.style.width = savedBackWidth
    backCard.style.maxWidth = savedBackMaxWidth

    const imgDataFront = canvasFront.toDataURL('image/png')
    const imgDataBack = canvasBack.toDataURL('image/png')
    const svcInfo = `Planilla SVC ${props.sheet.svcNumber || ''} – ${props.sheet.month || ''} ${props.sheet.year || ''}`

    // Sobreescribir el popup con la vista final de impresión de 2 páginas
    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>${svcInfo}<\/title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { background: #fff; width: 210mm; }
            @page {
              size: A4 portrait;
              margin: 0;
            }
            .page {
              width: 210mm;
              height: 297mm;
              display: flex;
              align-items: flex-start;
              justify-content: center;
              overflow: hidden;
              padding: 8mm 10mm;
              page-break-after: always;
              break-after: page;
            }
            .page:last-child {
              page-break-after: avoid;
              break-after: avoid;
            }
            img {
              width: 100%;
              height: auto;
              display: block;
            }
            .page:first-child img {
              transform: scaleY(0.88);
              transform-origin: top center;
            }
          <\/style>
        <\/head>
        <body>
          <div class="page">
            <img src="${imgDataFront}" alt="Planilla Frente" />
          <\/div>
          <div class="page">
            <img src="${imgDataBack}" alt="Resumen" />
          <\/div>
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() { 
                window.print(); 
                setTimeout(function() { window.close(); }, 1500);
              }, 400);
            });
          <\/script>
        <\/body>
      <\/html>
    `)
    win.document.close()

  } catch (err) {
    // Restaurar en caso de excepción catastrófica
    frontCard.classList.remove('printing-layout')
    backCard.classList.remove('printing-layout')

    frontCard.style.display = frontWasHidden ? 'none' : ''
    frontCard.style.visibility = ''
    frontCard.style.position = savedFrontPosition
    frontCard.style.top = savedFrontTop
    frontCard.style.left = savedFrontLeft
    frontCard.style.width = savedFrontWidth
    frontCard.style.maxWidth = savedFrontMaxWidth

    backCard.style.display = backWasHidden ? 'none' : ''
    backCard.style.visibility = ''
    backCard.style.position = savedBackPosition
    backCard.style.top = savedBackTop
    backCard.style.left = savedBackLeft
    backCard.style.width = savedBackWidth
    backCard.style.maxWidth = savedBackMaxWidth

    console.error('[Print] Error:', err)
    win.close()
    snackbarText.value = 'Error al preparar la impresión'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    printing.value = false
  }
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

    const firestoreAssignments = JSON.parse(JSON.stringify(localAssignments.value))
    await updateDoc(doc(db, 'serviceSheets', props.sheet.id), {
      assignments: firestoreAssignments
    })

    snackbarText.value = user ? `Asignado: ${formatIdentity(user)}` : 'Asignación quitada'
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err) {
    console.error('[Template] Error al asignar:', err)
    snackbarText.value = 'Error al actualizar asignación'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

// ─── AUTOCOMPLETAR ───────────────────────────────────────────────────────────
const startAutoFill = async () => {
  if (!props.availability || activeShifts.value.length === 0) {
    snackbarText.value = 'No hay turnos configurados o no hay disponibilidades'
    snackbarColor.value = 'error'
    snackbar.value = true
    return
  }

  // Contar celdas vacías
  let empty = 0
  daysInMonth.value.forEach(day => {
    activeShifts.value.forEach((_: unknown, sIdx: number) => {
      if (!getAssignment(day.dayNum, sIdx)) empty++
    })
  })

  const available = new Set(
    (props.availability || []).filter(a => a.serviceId === props.sheet.id).map(a => a.userId)
  ).size

  autoFillStats.value = { available, empty }
  autoFillDialog.value = true
}

const confirmAutoFill = async () => {
  if (!props.sheet?.id || !props.availability) return
  autoFilling.value = true
  autoFillDialog.value = false

  try {
    // 1. Buscar todas las hojas hermanas (mismo SVC + mismo mes + mismo año)
    const siblingsSnap = await getDocs(query(
      collection(db, 'serviceSheets'),
      where('svcNumber', '==', props.sheet.svcNumber),
      where('month', '==', props.sheet.month),
      where('year', '==', props.sheet.year)
    ))
    // siblingSheetIds used implicitly via siblingsSnap.docs below

    // 2. Recopilar asignaciones ya existentes en hojas hermanas (para evitar duplicados)
    // Map: 'userId-dayNum-shiftIdx' => true
    const occupiedSlots = new Set<string>()
    siblingsSnap.docs.forEach(d => {
      const sibAssignments: Record<string, Record<string, string>> = d.data().assignments || {}
      Object.entries(sibAssignments).forEach(([dayStr, shifts]) => {
        Object.entries(shifts).forEach(([sIdxStr, name]) => {
          if (name && d.id !== props.sheet.id) {
            // Guardamos la identidad textual para bloquear duplicados
            occupiedSlots.add(`${name}|${dayStr}|${sIdxStr}`)
          }
        })
      })
    })

    // 3. Obtener disponibilidades de esta hoja
    const thisAvailability = (props.availability || []).filter(a => a.serviceId === props.sheet.id)

    // 4. Construir mapa: dia -> turno -> [usuarios disponibles]
    const slotPool: Record<string, Record<string, any[]>> = {}
    daysInMonth.value.forEach(day => {
      slotPool[day.dayNum] = {}
      activeShifts.value.forEach((_: unknown, sIdx: number) => {
        const avUsers = thisAvailability.filter(a => {
          if (a.selections) return a.selections[day.dayNum.toString()]?.includes(sIdx)
          return (a.days || []).includes(day.dayNum) && (a.shiftIndexes || []).includes(sIdx)
        })
        slotPool[day.dayNum][sIdx] = avUsers
      })
    })

    // 5. Conteo de asignaciones por usuario (para balance equitativo)
    const userAssignCount: Record<string, number> = {}
    thisAvailability.forEach(a => { userAssignCount[a.userId] = 0 })

    // 6. Asignar: para cada celda vacía, elegir el usuario menos asignado que no esté ocupado en otra hoja
    const newAssignments = JSON.parse(JSON.stringify(localAssignments.value))

    daysInMonth.value.forEach(day => {
      activeShifts.value.forEach((_: unknown, sIdx: number) => {
        // Si ya hay alguien asignado, no pisar
        if (newAssignments[day.dayNum]?.[sIdx]) return

        const candidates = slotPool[day.dayNum][sIdx]
          .filter(u => {
            const identity = formatIdentity(u)
            // No asignar si ya está en otra hoja hermana en el mismo turno/día
            return !occupiedSlots.has(`${identity}|${day.dayNum}|${sIdx}`)
          })
          .sort((a, b) => (userAssignCount[a.userId] || 0) - (userAssignCount[b.userId] || 0))

        if (candidates.length === 0) return

        const chosen = candidates[0]
        const identity = formatIdentity(chosen)

        if (!newAssignments[day.dayNum]) newAssignments[day.dayNum] = {}
        newAssignments[day.dayNum][sIdx] = identity
        userAssignCount[chosen.userId] = (userAssignCount[chosen.userId] || 0) + 1
        // Marcar para que otras celdas del mismo día/turno en esta hoja también lo eviten
        occupiedSlots.add(`${identity}|${day.dayNum}|${sIdx}`)
      })
    })

    // 7. Guardar en Firestore
    await updateDoc(doc(db, 'serviceSheets', props.sheet.id), { assignments: newAssignments })
    localAssignments.value = newAssignments

    snackbarText.value = 'Autocompletado aplicado con éxito'
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (err: any) {
    console.error('[Autocompletar] Error:', err)
    snackbarText.value = 'Error al autocompletar: ' + err.message
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    autoFilling.value = false
  }
}

</script>

<style scoped>
/* ── Contenedor de scroll horizontal en pantalla ─────────────────────── */
.sheet-scroll-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Centra la planilla y le da un max-width generoso en desktop */
.sheet-outer-centering {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0 2px;
}

.sheet-portrait-width {
  max-width: 800px !important;
}

/* ── Planilla ─────────────────────────────────────────────────────────── */
.service-sheet {
  /* En pantalla: ocupa todo el ancho disponible, máximo A4 landscape (297mm ≈ 1122px) */
  width: 100%;
  max-width: 1122px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important;
  color: #000 !important;
  border: 1px solid #000;
}

.service-sheet * {
  color: #000 !important;
}

/* Tabla horizontal scrollable en móviles */
.table-content {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Comprime verticalmente la grilla de días/horarios un 10% solo en impresión */
.printing-layout .grid-compact {
  transform: scaleY(0.90);
  transform-origin: top center;
}

/* Comprime verticalmente en impresión y ajusta márgenes entre secciones */
.printing-layout .entity-box {
  transform: scaleY(0.90);
  transform-origin: top center;
  margin-bottom: 0 !important;   /* Sin espacio entre entidad y personal encargado */
}

.printing-layout .personal-box {
  transform: scaleY(0.90);
  transform-origin: top center;
  margin-bottom: 3px !important; /* Mitad del espacio hacia la grilla de días */
}

.province-label {
  position: absolute;
  top: 0;
  left: 0;
  text-align: center;
  line-height: 1.2;
  font-size: 0.75rem;
  font-weight: 800;
}

.empty-assigned-cell {
  background-color: #d9d9d9 !important;
}

.summary-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.division-label {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 0.75rem;
  font-weight: 800;
}

.border-black { border: 1px solid #000 !important; }
.border-black-thick { border: 2px solid #000 !important; }
.border-b-black { border-bottom: 1px solid #000 !important; }

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* En pantallas muy pequeñas, apilar las columnas */
@media (max-width: 640px) {
  .info-grid {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}

.field-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.label {
  font-weight: 800;
  font-size: 0.80rem;
  margin-right: 6px;
  white-space: nowrap;
}

.value.box {
  flex-grow: 1;
  border: 1px solid #000;
  padding: 3px 8px;
  min-height: 26px;
  font-size: 0.82rem;
}

.villa-style {
  font-family: 'Google Sans', sans-serif !important;
  font-weight: 900 !important;
  letter-spacing: 0.5px;
}

.small-text { font-size: 0.65rem; }
.assignment-cell { font-size: 0.70rem; color: #000; min-width: 130px; }

.interactive-cell.editing {
  cursor: pointer;
  transition: background-color 0.2s;
}

.interactive-cell.editing:hover {
  background-color: #e3f2fd !important;
}

/* ── ESTILOS DE IMPRESIÓN A4 ─────────────────────────────────────────── */
@media print {
  /* Tamaño A4 portrait. Cambiar a landscape si los turnos son muchos: */
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }

  /* Ocultar controles de UI */
  .v-toolbar,
  .v-btn,
  .v-snackbar,
  .v-menu,
  .v-overlay {
    display: none !important;
  }

  /* Hacer que toda la página sea blanca */
  html, body {
    background: white !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Ocultar el scroll-wrapper y el fondo gris */
  .sheet-scroll-wrapper,
  .sheet-outer-centering,
  .bg-grey-lighten-4 {
    background: white !important;
    overflow: visible !important;
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
  }

  /* La planilla ocupa el 100% del área imprimible y se autoescala */
  .service-sheet {
    box-shadow: none !important;
    border: none !important;
    margin: 0 !important;
    padding: 0 !important;
    max-width: none !important;
    width: 100% !important;
    /* Escalar automáticamente para que todo quepa en una página */
    transform-origin: top left;
  }

  /* Sin scroll en tabla durante impresión */
  .table-content {
    overflow: visible !important;
  }

  /* Reducir tamaños de fuente para compactar */
  .print-container {
    font-size: 7pt !important;
  }

  .label {
    font-size: 5.5pt !important;
  }

  .value.box {
    font-size: 6pt !important;
    min-height: 11pt !important;
    padding: 0pt 3pt !important;
  }

  table th, table td {
    font-size: 5.5pt !important;
    padding: 0pt 1pt !important;
    line-height: 1.05 !important;
  }

  .field-row {
    margin-bottom: 0px !important;
  }

  .small-text {
    font-size: 5pt !important;
  }

  .assignment-cell {
    font-size: 5.5pt !important;
    min-width: 0 !important;
  }

  h1 {
    font-size: 10pt !important;
    margin-bottom: 2pt !important;
  }

  .text-h6, .text-overline {
    font-size: 6.5pt !important;
  }

  .province-label,
  .division-label {
    font-size: 5.5pt !important;
  }

  .empty-assigned-cell {
    background-color: #d9d9d9 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .summary-table th, 
  .summary-table td {
    font-size: 5.5pt !important;
    padding: 1pt 1pt !important;
    line-height: 1.05 !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .summary-table {
    width: 100% !important;
    table-layout: fixed !important;
  }

  .signature-section {
    margin-top: 15pt !important;
    page-break-inside: avoid;
  }

  .entity-box, .personal-box {
    padding: 2pt !important;
    margin-bottom: 2pt !important;
  }

  .header-section {
    padding-top: 4pt !important;
    margin-bottom: 4pt !important;
  }

  /* Evitar cortes de página en medio de la tabla */
  table { page-break-inside: avoid; }
  tr { page-break-inside: avoid; }
}
</style>
