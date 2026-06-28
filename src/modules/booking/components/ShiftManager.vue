<template>
  <div class="shift-manager">
    <div class="d-flex align-center mb-6">
      <v-btn icon="mdi-arrow-left" variant="text" color="grey-darken-1" to="/inicio" class="mr-2" />
      <v-chip color="primary" variant="tonal" class="font-weight-bold">
        {{ myAssignments.length }} TURNOS CONFIRMADOS
      </v-chip>
      <v-spacer />
    </div>

    <!-- CARGANDO -->
    <v-row v-if="loading">
      <v-col v-for="n in 3" :key="n" cols="12" md="4">
        <v-skeleton-loader type="article" border class="rounded-xl"></v-skeleton-loader>
      </v-col>
    </v-row>

    <!-- GRILLA DE TURNOS -->
    <v-row v-else-if="myAssignments.length > 0" dense>
      <v-col v-for="(shift, idx) in myAssignments" :key="idx" cols="6" sm="4" md="3">
        <v-card class="shift-card border pa-3 h-100" rounded="xl" elevation="0">
          <div class="d-flex justify-space-between align-start mb-2">
            <div>
              <div class="text-caption text-success font-weight-black line-height-1" style="font-size: 0.65rem !important;">
                CONFIRMADO
              </div>
              <h3 class="text-subtitle-2 font-weight-bold text-truncate" style="max-width: 140px;">{{ shift.entidad }}</h3>
            </div>
            <div class="d-flex align-center">
              <v-icon color="success" size="18" class="mr-1">mdi-check-decagram</v-icon>
              <v-btn
                icon="mdi-close"
                size="x-small"
                variant="tonal"
                color="error"
                class="ml-1"
                @click.stop="confirmRemove(shift)"
              ></v-btn>
            </div>
          </div>
          
          <v-divider class="mb-3" />

          <div class="d-flex align-center mb-1">
            <v-icon size="14" class="mr-2" color="primary">mdi-calendar-range</v-icon>
            <span class="text-caption font-weight-bold text-grey-darken-2">
              Día {{ shift.dayNum }} de {{ shift.month }}
            </span>
          </div>

          <div class="d-flex align-center mb-1">
            <v-icon size="14" class="mr-2" color="primary">mdi-clock-outline</v-icon>
            <span class="text-caption font-weight-bold text-grey-darken-2">
              {{ shift.start }} - {{ shift.end }}
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
    
    <!-- DIÁLOGO CONFIRMACIÓN -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card rounded="xl" class="pa-4">
        <v-card-title class="text-h6 font-weight-black d-flex align-center">
          <v-icon color="error" class="mr-2">mdi-alert-circle-outline</v-icon>
          ¿Eliminar turno?
        </v-card-title>
        <v-card-text class="pt-2 text-body-1">
          Estás por eliminar tu turno en <span class="font-weight-bold">{{ deleteDialog.entidad }}</span> 
          del día <span class="font-weight-bold">{{ deleteDialog.day }}</span>. 
          <br><br>
          Esta posición quedará vacante en la planilla general. ¿Confirmar?
        </v-card-text>
        <v-card-actions class="pt-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey" @click="deleteDialog.show = false">Cancelar</v-btn>
          <v-btn color="error" variant="elevated" rounded="pill" class="px-6 font-weight-bold" :loading="removing" @click="handleRemove">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="pill" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, reactive } from 'vue'
import { collection, query, where, onSnapshot, doc, updateDoc, deleteField } from 'firebase/firestore'
import { db } from '../../../plugins/firebase'
import { useAuthStore } from '../../auth/stores/authStore'

const authStore = useAuthStore()
const loading = ref(true)
const removing = ref(false)
const assignmentsData = ref<any[]>([])
const deleteDialog = reactive({ show: false, entidad: '', day: '', sheetId: '', dayNum: '', shiftIdx: '' })
const snackbar = reactive({ show: false, text: '', color: 'success' })
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
          const dayNum = parseInt(day)
          const shiftInfo = sheet.shifts[parseInt(sIdx)]
          
          if (shiftInfo) {
            // LÓGICA DE AUTO-LIMPIEZA (AUTO-PURGE)
            const shiftDate = new Date(sheetYear, sheetMonthIdx, dayNum)
            const oneDayAfter = new Date(shiftDate)
            oneDayAfter.setDate(oneDayAfter.getDate() + 1)

            if (now > oneDayAfter) {
              // El turno ya pasó hace más de 24hs, lo purgamos de Firebase
              autoPurgeAssignment(sheet.id, day, sIdx)
              return // No lo añadimos a la lista visual
            }

            results.push({
              entidad: sheet.entidad || 'Servicio General',
              month: sheet.month,
              year: sheet.year,
              dayNum: day,
              shiftIdx: sIdx,
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

const confirmRemove = (shift: any) => {
  deleteDialog.entidad = shift.entidad
  deleteDialog.day = `${shift.dayNum} ${shift.month}`
  deleteDialog.sheetId = shift.sheetId
  deleteDialog.dayNum = shift.dayNum
  deleteDialog.shiftIdx = shift.shiftIdx
  deleteDialog.show = true
}

const handleRemove = async () => {
  if (!deleteDialog.sheetId) return
  removing.value = true
  try {
    const sheetRef = doc(db, 'servicios', deleteDialog.sheetId)
    
    // El formato de Firestore es assignments.{dia}.{indice_turno}
    const path = `assignments.${deleteDialog.dayNum}.${deleteDialog.shiftIdx}`
    
    await updateDoc(sheetRef, {
      [path]: deleteField()
    })
    
    snackbar.text = 'Turno eliminado correctamente'
    snackbar.color = 'success'
    snackbar.show = true
    deleteDialog.show = false
  } catch (err) {
    console.error('[ShiftManager] Error eliminando turno:', err)
    snackbar.text = 'Error al eliminar el turno'
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    removing.value = false
  }
}

// Función para purga automática silenciosa de turnos viejos
const autoPurgeAssignment = async (sheetId: string, day: string, sIdx: string) => {
  try {
    const sheetRef = doc(db, 'servicios', sheetId)
    const path = `assignments.${day}.${sIdx}`
    await updateDoc(sheetRef, {
      [path]: deleteField()
    })
    console.log(`[AutoPurge] Turno expirado eliminado: ${sheetId} - Día ${day}`)
  } catch (err) {
    console.warn('[AutoPurge] Error purgando turno viejo:', err)
  }
}
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
