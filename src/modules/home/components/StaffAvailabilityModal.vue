<template>
  <v-dialog :model-value="show" max-width="700" persistent transition="dialog-bottom-transition">
    <v-card rounded="xl" class="pa-4">
      <v-card-title class="d-flex align-center px-2">
        <v-icon color="success" class="mr-3">mdi-account-clock</v-icon>
        <span class="text-h6 font-weight-black">Disponibilidad del Personal</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')"></v-btn>
      </v-card-title>

      <v-card-text class="pa-2">
        <!-- FILTRO POR SERVICIO -->
        <v-select
          v-model="selectedServiceId"
          :items="availableSheets"
          item-title="label"
          item-value="id"
          label="Filtrar por Servicio"
          variant="solo-filled"
          flat rounded="lg"
          density="compact"
          hide-details
          class="mb-4"
          prepend-inner-icon="mdi-filter"
        />

        <!-- ESTADO DE CARGA -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="40" class="mb-3"></v-progress-circular>
          <div class="text-body-2 text-grey">Cargando disponibilidad...</div>
        </div>

        <!-- SIN DATOS -->
        <div v-else-if="filteredAvailability.length === 0" class="text-center py-12">
          <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-calendar-question</v-icon>
          <div v-if="selectedServiceId" class="px-6">
            <div class="text-h6 font-weight-bold text-grey-darken-2">Sin respuestas aún</div>
            <p class="text-body-2 text-grey">Ningún guardia ha cargado su disponibilidad para este servicio todavía.</p>
          </div>
          <div v-else class="px-6">
            <div class="text-h6 font-weight-bold text-grey-darken-2">Esperando selección</div>
            <p class="text-body-2 text-grey">Por favor, elegí un servicio arriba para ver quiénes están disponibles.</p>
          </div>
        </div>

        <!-- BANCO DE DISPONIBILIDAD -->
        <div v-else>
          <!-- RESUMEN ESTADÍSTICO -->
          <v-card variant="tonal" color="primary" rounded="lg" class="pa-3 mb-4">
            <div class="d-flex justify-space-around text-center">
              <div>
                <div class="text-h5 font-weight-black">{{ filteredAvailability.length }}</div>
                <div class="text-caption">Respondieron</div>
              </div>
              <v-divider vertical class="mx-2"></v-divider>
              <div>
                <div class="text-h5 font-weight-black">{{ linkedEmails.length }}</div>
                <div class="text-caption">Solicitados</div>
              </div>
              <v-divider vertical class="mx-2"></v-divider>
              <div>
                <div class="text-h5 font-weight-black">{{ pendingCount }}</div>
                <div class="text-caption">Pendientes</div>
              </div>
            </div>
          </v-card>

          <!-- LISTA POR PERSONA -->
          <v-expansion-panels variant="accordion" class="mb-4">
            <v-expansion-panel
              v-for="entry in filteredAvailability"
              :key="entry.id"
              rounded="lg"
              class="mb-2"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center w-100">
                  <v-avatar color="primary" variant="tonal" size="36" class="mr-3">
                    <v-icon size="18">mdi-account</v-icon>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="font-weight-bold text-body-2">{{ entry.userEmail }}</div>
                    <div class="text-caption text-grey">
                      {{ entry.days.length }} día{{ entry.days.length !== 1 ? 's' : '' }} disponible{{ entry.days.length !== 1 ? 's' : '' }}
                      · Enviado el {{ formatDate(entry.submittedAt) }}
                    </div>
                  </div>
                  <v-chip
                    color="success"
                    variant="flat"
                    size="x-small"
                    class="font-weight-bold ml-2"
                  >
                    {{ entry.days.length }}d
                  </v-chip>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <!-- DÍAS DISPONIBLES DISCRIMINADOS -->
                <div v-if="entry.selections">
                  <div v-for="(shift, sIdx) in (serviceShifts as any[])" :key="sIdx">
                    <div v-if="getDaysForShift(entry.selections, Number(sIdx)).length > 0" class="mb-3">
                      <div class="text-overline font-weight-black mb-1" :class="'text-' + getShiftColor(Number(sIdx))">
                        Turno {{ Number(sIdx) + 1 }}: {{ shift.start }} - {{ shift.end }}
                      </div>
                      <div class="d-flex flex-wrap ga-1">
                        <v-chip
                          v-for="day in getDaysForShift(entry.selections, Number(sIdx))"
                          :key="day"
                          :color="getShiftColor(Number(sIdx))"
                          variant="flat"
                          size="x-small"
                          class="font-weight-bold"
                        >
                          {{ day }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- MODO COMPATIBILIDAD (Si no hay 'selections' pero hay 'days') -->
                <div v-else-if="entry.days && entry.days.length > 0">
                  <div class="text-overline font-weight-bold text-success mb-1">Días disponibles (Global)</div>
                  <div class="d-flex flex-wrap ga-1">
                    <v-chip v-for="day in entry.days" :key="day" color="success" variant="flat" size="x-small" class="font-weight-bold">
                      {{ day }}
                    </v-chip>
                  </div>
                </div>

                <!-- NOTAS -->
                <div v-if="entry.notes" class="mt-2">
                  <div class="text-overline font-weight-bold text-amber-darken-3 mb-1">Notas</div>
                  <div class="text-body-2 bg-amber-lighten-5 pa-2 rounded-lg border-amber-lighten-4 border">{{ entry.notes }}</div>
                </div>

                <!-- ACCIÓN: DESVINCULAR -->
                <div class="d-flex justify-end mt-4">
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="error"
                    rounded="pill"
                    class="font-weight-bold"
                    prepend-icon="mdi-link-variant-off"
                    @click="$emit('unlink', entry)"
                  >
                    Desvincular
                  </v-btn>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <!-- PERSONAS QUE AÚN NO RESPONDIERON -->
          <div v-if="pendingEmails.length > 0">
            <div class="text-subtitle-2 font-weight-bold mb-2 text-amber-darken-3">
              <v-icon size="18" class="mr-1">mdi-clock-alert</v-icon>
              Pendientes de respuesta ({{ pendingEmails.length }})
            </div>
            <div class="d-flex flex-wrap ga-1 mb-2">
              <v-chip
                v-for="email in pendingEmails"
                :key="email"
                color="amber-darken-2"
                variant="tonal"
                size="small"
                class="font-weight-bold"
              >
                <v-icon start size="14">mdi-email-alert</v-icon>
                {{ email }}
              </v-chip>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  show: boolean
  loading?: boolean
  sheets?: any[]
  availabilityData?: any[]  // Array de submissions de disponibilidad
  linkedEmailsMap?: Record<string, string[]>  // serviceId => emails vinculados
}>()

const emit = defineEmits(['close', 'unlink', 'filter-change'])

const selectedServiceId = ref<string | null>(null)

const availableSheets = computed(() => {
  if (!props.sheets) return []
  return props.sheets.map(s => ({
    id: s.id,
    label: `SVC ${s.svcNumber || '---'} — ${s.month} ${s.year}`
  }))
})

const filteredAvailability = computed(() => {
  if (!props.availabilityData || !selectedServiceId.value) return []
  return props.availabilityData.filter(a => a.serviceId === selectedServiceId.value)
})

const linkedEmails = computed(() => {
  if (!props.linkedEmailsMap || !selectedServiceId.value) return []
  return props.linkedEmailsMap[selectedServiceId.value] || []
})

const pendingEmails = computed(() => {
  const responded = new Set(filteredAvailability.value.map(a => a.userEmail))
  return linkedEmails.value.filter(email => !responded.has(email))
})

const pendingCount = computed(() => pendingEmails.value.length)

const serviceShifts = computed(() => {
  if (!props.sheets || !selectedServiceId.value) return []
  const sheet = props.sheets.find(s => s.id === selectedServiceId.value)
  if (!sheet?.shifts) return []
  return sheet.shifts.filter((s: any) => s !== null)
})

watch(selectedServiceId, (newId) => {
  emit('filter-change', newId)
})

watch(() => props.show, (isVisible) => {
  if (isVisible && availableSheets.value.length > 0 && !selectedServiceId.value) {
    selectedServiceId.value = availableSheets.value[0].id
  }
})

const formatDate = (timestamp: any) => {
  if (!timestamp) return '---'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const getShiftColor = (idx: number) => {
  const colors = ['success', 'primary', 'deep-purple', 'orange']
  return colors[idx % colors.length]
}

const getDaysForShift = (selections: Record<string, number[]>, shiftIdx: number): number[] => {
  if (!selections) return []
  const days: number[] = []
  Object.entries(selections).forEach(([day, shifts]) => {
    if (shifts.includes(shiftIdx)) {
      days.push(Number(day))
    }
  })
  return days.sort((a, b) => a - b)
}
</script>
