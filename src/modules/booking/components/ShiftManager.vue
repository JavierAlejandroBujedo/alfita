<template>
  <div class="shift-manager">
    <div class="d-flex align-center mb-6">
      <h2 class="text-h5 font-weight-black">Mi Agenda de Turnos</h2>
      <v-spacer />
      <v-chip color="primary" variant="tonal" class="font-weight-bold">
        {{ myAssignments.length }} TURNOS CONFIRMADOS
      </v-chip>
    </div>

    <!-- CARGANDO -->
    <v-row v-if="loading">
      <v-col v-for="n in 3" :key="n" cols="12" md="4">
        <v-skeleton-loader type="article" border class="rounded-xl"></v-skeleton-loader>
      </v-col>
    </v-row>

    <!-- GRILLA DE TURNOS -->
    <v-row v-else-if="myAssignments.length > 0">
      <v-col v-for="(shift, idx) in myAssignments" :key="idx" cols="12" md="4">
        <v-card class="shift-card border pa-4" rounded="xl" elevation="0">
          <div class="d-flex justify-space-between align-start mb-4">
            <div>
              <div class="text-overline text-success font-weight-black line-height-1">
                CONFIRMADO
              </div>
              <h3 class="text-h6 font-weight-bold">{{ shift.entidad }}</h3>
            </div>
            <v-icon color="grey-lighten-2">mdi-check-decagram</v-icon>
          </div>

          <v-divider class="mb-4" />

          <div class="d-flex align-center mb-2">
            <v-icon size="18" class="mr-2" color="primary">mdi-calendar-range</v-icon>
            <span class="text-body-2 font-weight-bold text-grey-darken-2">
              Día {{ shift.dayNum }} de {{ shift.month }} {{ shift.year }}
            </span>
          </div>

          <div class="d-flex align-center mb-6">
            <v-icon size="18" class="mr-2" color="primary">mdi-clock-outline</v-icon>
            <span class="text-body-2 font-weight-bold text-grey-darken-2">
              Turno: {{ shift.start }} - {{ shift.end }}
            </span>
          </div>


        </v-card>
      </v-col>
    </v-row>

    <!-- EMPTY STATE -->
    <v-card v-else rounded="xl" border flat class="pa-12 text-center bg-grey-lighten-5 mt-4">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-calendar-blank</v-icon>
      <div class="text-h6 text-grey-darken-1 font-weight-bold">No tenés turnos asignados para este periodo</div>
      <div class="text-body-2 text-grey">Cuando el Designador confirme la planilla, tus turnos aparecerán aquí.</div>
    </v-card>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../../plugins/firebase'
import { useAuthStore } from '../../auth/stores/authStore'

const authStore = useAuthStore()
const loading = ref(true)
const assignmentsData = ref<any[]>([])
let unsubscribe: any = null

const myAssignments = computed(() => {
  if (!authStore.userData) return []
  
  const myIdentity = `${authStore.userData.hierarchy || ''} ${authStore.userData.displayName || ''}`.trim()
  const results: any[] = []

  const monthNamesMap: Record<string, number> = {
    'ENERO': 0, 'FEBRERO': 1, 'MARZO': 2, 'ABRIL': 3, 'MAYO': 4, 'JUNIO': 5,
    'JULIO': 6, 'AGOSTO': 7, 'SEPTIEMBRE': 8, 'OCTUBRE': 9, 'NOVIEMBRE': 10, 'DICIEMBRE': 11
  }
  const now = new Date()
  const nowMonth = now.getMonth()
  const nowYear = now.getFullYear()

  assignmentsData.value.forEach(sheet => {
    if (!sheet.assignments || !sheet.published) return
    
    // Filtro de temporalidad: No mostrar meses pasados
    const sheetMonthIdx = monthNamesMap[sheet.month.toUpperCase()] || 0
    const sheetYear = parseInt(sheet.year)
    if (sheetYear < nowYear || (sheetYear === nowYear && sheetMonthIdx < nowMonth)) {
      return
    }
    
    // Recorrer los días de la planilla
    Object.entries(sheet.assignments).forEach(([day, shiftsMap]: [string, any]) => {
      // Recorrer los turnos del día
      Object.entries(shiftsMap).forEach(([sIdx, identity]: [string, any]) => {
        if (identity === myIdentity) {
          const shiftInfo = sheet.shifts[parseInt(sIdx)]
          if (shiftInfo) {
            results.push({
              entidad: sheet.entidad || 'Servicio General',
              month: sheet.month,
              year: sheet.year,
              dayNum: day,
              start: shiftInfo.start,
              end: shiftInfo.end,
              sheetId: sheet.id
            })
          }
        }
      })
    })
  })

  // Ordenar por día (asumiendo mismo mes por ahora)
  return results.sort((a, b) => parseInt(a.dayNum) - parseInt(b.dayNum))
})

onMounted(() => {
  // Buscamos todos los servicios publicados
  const q = query(
    collection(db, 'servicios'),
    where('published', '==', true)
  )

  unsubscribe = onSnapshot(q, (snap) => {
    assignmentsData.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    loading.value = false
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
.shift-card {
  border: 1px solid #e0e0e0 !important;
  transition: all 0.2s ease;
}

.shift-card:hover {
  border-color: #1a73e8 !important;
  background-color: #f8f9fa;
  transform: translateY(-2px);
}

.line-height-1 { line-height: 1; }
</style>
