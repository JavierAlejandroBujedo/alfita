<template>
  <v-dialog :model-value="show" max-width="600" persistent transition="dialog-bottom-transition">
    <v-card rounded="xl" class="pa-4">
      <v-card-title class="d-flex align-center px-2">
        <v-icon color="success" class="mr-3">mdi-calendar-check</v-icon>
        <span class="text-h6 font-weight-black">Enviar Disponibilidad</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')"></v-btn>
      </v-card-title>

      <v-card-text class="pa-2">
        <!-- INFO DEL SERVICIO -->
        <v-card variant="tonal" color="primary" rounded="lg" class="pa-3 mb-4">
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-file-document</v-icon>
            <div>
              <div class="text-caption font-weight-bold text-uppercase">Servicio Vinculado</div>
              <div class="text-body-1 font-weight-black">
                SVC {{ serviceData?.svcNumber || '---' }} — {{ serviceData?.month }} {{ serviceData?.year }}
              </div>
              <div v-if="serviceData?.description" class="text-caption">{{ serviceData.description }}</div>
            </div>
          </div>
        </v-card>

        <!-- INSTRUCCIONES -->
        <div class="bg-amber-lighten-5 pa-3 rounded-lg mb-4 d-flex align-center">
          <v-icon color="amber-darken-3" class="mr-3">mdi-information-outline</v-icon>
          <div class="text-caption text-amber-darken-4 font-weight-bold">
            Paso 1: Seleccioná un turno para "pintar".<br>
            Paso 2: Tocá los días en el calendario para asignar ese turno.
          </div>
        </div>

        <!-- SELECTOR DE TURNO (PINCEL) -->
        <div class="mb-4">
          <div class="text-subtitle-2 font-weight-black mb-2">
            <v-icon size="18" class="mr-1">mdi-brush</v-icon>
            1. Elegí el turno que querés marcar:
          </div>
          <div class="d-flex ga-2 flex-wrap">
            <v-btn
              v-for="(shift, idx) in (serviceShifts as any[])"
              :key="idx"
              :color="activeShiftIndex === Number(idx) ? getShiftColor(Number(idx)) : 'grey-lighten-3'"
              :variant="activeShiftIndex === Number(idx) ? 'elevated' : 'flat'"
              @click="activeShiftIndex = Number(idx)"
              rounded="pill"
              class="font-weight-black text-none"
              size="small"
              :class="{ 'elevation-4': activeShiftIndex === Number(idx) }"
            >
              <v-icon start :size="16" v-if="activeShiftIndex === Number(idx)">mdi-check-circle</v-icon>
              T{{ Number(idx) + 1 }}: {{ shift.start }} - {{ shift.end }}
            </v-btn>
          </div>
        </div>

        <!-- CALENDARIO DE DÍAS -->
        <div class="text-subtitle-2 font-weight-black mb-2">
          <v-icon size="18" class="mr-1">mdi-calendar-month</v-icon>
          2. Marcá los días para el turno seleccionado:
        </div>

        <div class="days-grid mb-4">
          <div class="day-header" v-for="dayName in ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']" :key="dayName">
            {{ dayName }}
          </div>
          <div v-for="n in firstDayOffset" :key="'blank-' + n" class="day-cell blank"></div>
          <div
            v-for="day in daysInMonth"
            :key="day"
            class="day-cell"
            :class="{
              'today': isToday(day),
              'has-shifts': selections[day] && selections[day].length > 0
            }"
            @click="toggleShiftForDay(day)"
          >
            <!-- CAPAS DE COLOR (Cuadrantes/Esquinas) -->
            <div 
              v-for="sIdx in selections[day]" 
              :key="sIdx" 
              class="shift-corner" 
              :class="'corner-' + (sIdx % 4)"
              :style="{ backgroundColor: getShiftHexColor(sIdx) }"
            ></div>

            <span class="day-number">{{ day }}</span>
          </div>
        </div>

        <!-- MODAL EXCESO DE HORAS -->
        <v-dialog v-model="limitDialog" max-width="400">
          <v-card rounded="xl" class="pa-6 text-center">
            <v-icon color="error" size="64" class="mb-4">mdi-alert-circle-outline</v-icon>
            <v-card-title class="text-h6 font-weight-black">Exceso de Horas</v-card-title>
            <v-card-text class="text-body-2 py-4">
              No se puede asignar este turno. Un usuario no puede exceder las <strong>16 horas de servicio por día</strong>.
            </v-card-text>
            <v-btn block color="error" rounded="pill" variant="elevated" @click="limitDialog = false">
              Entendido
            </v-btn>
          </v-card>
        </v-dialog>

        <!-- RESUMEN DE SELECCIÓN -->
        <div class="mb-4" v-if="hasAnySelection">
          <div class="text-subtitle-2 font-weight-black mb-2 text-grey-darken-3">Resumen de disponibilidad:</div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="(count, idx) in shiftCounts"
              :key="idx"
              v-show="count > 0"
              size="small"
              :color="getShiftColor(Number(idx))"
              variant="tonal"
              class="font-weight-black"
            >
              Turno {{ Number(idx) + 1 }}: {{ count }} día{{ count !== 1 ? 's' : '' }}
            </v-chip>
            <v-btn variant="text" size="x-small" color="error" class="ml-auto font-weight-bold" @click="clearSelections">
              Limpiar todo
            </v-btn>
          </div>
        </div>

        <!-- ALERTA PERFIL INCOMPLETO -->
        <v-alert
          v-if="!isProfileComplete"
          type="warning"
          variant="tonal"
          rounded="lg"
          density="compact"
          class="mb-4"
          icon="mdi-account-alert"
        >
          <strong>Perfil incompleto.</strong> Debes completar Nombre y Apellido, DNI, Jerarquía y Repartición en tu perfil antes de enviar disponibilidad.
          <div class="mt-2">
            <v-btn size="small" color="warning" variant="elevated" rounded="pill" @click="openProfile" class="font-weight-bold">
              <v-icon start size="16">mdi-account-edit</v-icon>
              Completar Mi Perfil
            </v-btn>
          </div>
        </v-alert>

        <!-- NOTAS OPCIONALES -->
        <v-textarea
          v-model="notes"
          label="Notas adicionales (opcional)"
          placeholder="Ej: El día 15 solo puedo hasta las 18hs..."
          variant="solo-filled"
          flat rounded="lg"
          rows="2"
          no-resize
          hide-details
          class="mb-2"
        />
      </v-card-text>

      <v-card-actions class="px-2 pb-2">
        <v-btn
          block
          color="success"
          size="large"
          variant="elevated"
          rounded="pill"
          class="font-weight-bold elevation-4"
          :loading="loading"
          @click="handleSubmit"
          :disabled="!hasAnySelection || !isProfileComplete"
        >
          <v-icon start>mdi-check-circle</v-icon>
          Enviar {{ totalActiveDays }} días cargados
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../../../modules/auth/stores/authStore'

const authStore = useAuthStore()

const props = defineProps<{
  show: boolean
  loading?: boolean
  serviceData?: any
}>()

const emit = defineEmits(['close', 'submit'])

// Validar perfil completo
const isProfileComplete = computed(() => {
  const d = authStore.userData
  if (!d) return false
  return !!(d.displayName && d.dni && d.reparticion && d.hierarchy)
})

const openProfile = () => {
  emit('close')
  authStore.showProfileModal = true
}

// selections[day] = [shiftIndex, shiftIndex, ...]
const selections = ref<Record<number, number[]>>({})
const activeShiftIndex = ref(0)
const notes = ref('')
const limitDialog = ref(false)

const serviceShifts = computed(() => {
  if (!props.serviceData?.shifts) return []
  return props.serviceData.shifts.filter((s: any) => s !== null)
})

const hasAnySelection = computed(() => Object.keys(selections.value).length > 0)

const totalActiveDays = computed(() => Object.keys(selections.value).length)

const shiftCounts = computed(() => {
  const counts = serviceShifts.value.map(() => 0)
  Object.values(selections.value).forEach(shifts => {
    shifts.forEach(sIdx => {
      if (counts[sIdx] !== undefined) counts[sIdx]++
    })
  })
  return counts
})

const monthIndex = computed(() => {
  const months = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ]
  return months.indexOf(props.serviceData?.month || 'ENERO')
})

const daysInMonth = computed(() => {
  if (!props.serviceData) return 31
  const year = props.serviceData.year || new Date().getFullYear()
  return new Date(year, monthIndex.value + 1, 0).getDate()
})

const firstDayOffset = computed(() => {
  if (!props.serviceData) return 0
  const year = props.serviceData.year || new Date().getFullYear()
  const firstDay = new Date(year, monthIndex.value, 1).getDay()
  return firstDay === 0 ? 6 : firstDay - 1
})

const isToday = (day: number) => {
  const now = new Date()
  return now.getFullYear() === props.serviceData?.year &&
    now.getMonth() === monthIndex.value &&
    now.getDate() === day
}

const getDuration = (shift: any) => {
  if (!shift) return 0
  const [h1, m1] = shift.start.split(':').map(Number)
  const [h2, m2] = shift.end.split(':').map(Number)
  let diff = (h2 * 60 + m2) - (h1 * 60 + m1)
  if (diff < 0) diff += 24 * 60 // Horario nocturno
  return diff / 60
}

const toggleShiftForDay = (day: number) => {
  if (activeShiftIndex.value === -1) return

  const currentDayShifts = selections.value[day] || []
  const idx = currentDayShifts.indexOf(activeShiftIndex.value)

  if (idx >= 0) {
    // Quitar turno
    const updated = [...currentDayShifts]
    updated.splice(idx, 1)
    if (updated.length === 0) {
      delete selections.value[day]
    } else {
      selections.value[day] = updated
    }
  } else {
    // Agregar turno (Validar 16h)
    let totalHours = 0
    // Sumar horas actuales
    currentDayShifts.forEach(sIdx => {
      totalHours += getDuration(serviceShifts.value[sIdx])
    })
    // Sumar el nuevo
    totalHours += getDuration(serviceShifts.value[activeShiftIndex.value])

    if (totalHours > 16) {
      limitDialog.value = true
      return
    }

    if (!selections.value[day]) {
      selections.value[day] = [activeShiftIndex.value]
    } else {
      selections.value[day].push(activeShiftIndex.value)
    }
  }
}

const clearSelections = () => {
  selections.value = {}
}

const getShiftColor = (idx: number) => {
  const colors = ['success', 'primary', 'deep-purple', 'orange']
  return colors[idx % colors.length]
}

const getShiftHexColor = (idx: number) => {
  const hex = ['#4CAF50', '#2196F3', '#673AB7', '#FF9800']
  return hex[idx % hex.length]
}

watch(() => props.show, (isVisible) => {
  if (isVisible) {
    selections.value = {}
    activeShiftIndex.value = 0
    notes.value = ''
  }
})

const handleSubmit = () => {
  // Convertimos el mapa de selecciones a una lista plana para compatibilidad y facilidad
  // data.days: array de dias únicos
  // data.dailyAvailability: mapa detallado dia -> shiftIndexes
  const days = Object.keys(selections.value).map(Number).sort((a,b) => a-b)
  
  emit('submit', {
    days,
    selections: { ...selections.value },
    notes: notes.value
  })
}
</script>

<style scoped>
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.day-header {
  text-align: center;
  font-weight: 800;
  font-size: 11px;
  color: #888;
  padding: 4px 0;
  text-transform: uppercase;
}

.day-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border-radius: 12px;
  background-color: #f5f5f5;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  border: 1px solid transparent;
}

.day-cell:not(.blank):hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.day-cell.today {
  border: 2px solid #1565c0;
}

.day-cell.has-shifts {
  background-color: white;
  border-color: #ddd;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.day-number {
  z-index: 2;
}

.shift-corner {
  position: absolute;
  width: 50%;
  height: 50%;
  z-index: 1;
}

.corner-0 { top: 0; left: 0; border-top-left-radius: 12px; }
.corner-1 { top: 0; right: 0; border-top-right-radius: 12px; }
.corner-2 { bottom: 0; left: 0; border-bottom-left-radius: 12px; }
.corner-3 { bottom: 0; right: 0; border-bottom-right-radius: 12px; }

.shift-indicators {
  display: none;
}

.day-cell.blank {
  background: transparent;
  cursor: default;
}

.day-cell.blank:hover {
  transform: none;
  box-shadow: none;
}
</style>

