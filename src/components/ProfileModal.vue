<template>
  <v-dialog 
    :model-value="show" 
    @update:model-value="$emit('close')"
    max-width="1000"
    persistent
  >
    <v-card rounded="xl" class="pa-2 bg-grey-lighten-5 overflow-hidden">
      <!-- HEADER -->
      <v-card-title class="d-flex align-center pb-2 pt-2 px-4">
        <v-avatar color="primary" variant="tonal" size="40" class="mr-3">
          <v-icon size="20">mdi-account-circle-outline</v-icon>
        </v-avatar>
        <div class="text-h6 font-weight-bold">Mi Perfil</div>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')"></v-btn>
      </v-card-title>

      <v-card-text class="pa-2">
        <v-form ref="formRef" v-model="isValid" @submit.prevent="save">
          <v-row density="comfortable">
            <!-- COLUMNA IZQUIERDA: SERVICIO -->
            <v-col cols="12" md="6">
              <v-card variant="outlined" border rounded="lg" class="pa-4 bg-white h-100">
                <div class="text-caption font-weight-black text-primary mb-3 ls-1 text-overline">ESTRUCTURA DE SERVICIO</div>
                
                <div class="mb-3">
                  <div class="text-caption font-weight-bold text-grey-darken-2 ml-1 mb-1">REPARTICIÓN</div>
                  <v-select
                    v-model="profile.reparticion"
                    :items="reparticiones"
                    item-title="nombre"
                    item-value="id"
                    variant="solo-filled"
                    flat
                    density="compact"
                    rounded="lg"
                    :loading="loadingLists"
                    placeholder="Seleccioná tu unidad"
                    @update:model-value="profile.hierarchy = ''"
                    hide-details
                  />
                </div>

                <div class="mb-3">
                  <div class="text-caption font-weight-bold text-grey-darken-2 ml-1 mb-1">JERARQUÍA</div>
                  <v-select
                    v-model="profile.hierarchy"
                    :items="filteredJerarquias"
                    item-title="nombre"
                    item-value="nombre"
                    variant="solo-filled"
                    flat
                    density="compact"
                    rounded="lg"
                    placeholder="Tu rango institucional"
                    :disabled="!profile.reparticion"
                    :loading="loadingJer"
                    no-data-text="Sin jerarquías disponibles para esta repartición"
                    hide-details
                  />
                  <div v-if="profile.reparticion && !loadingJer" class="text-caption text-grey ml-1 mt-1">
                    {{ filteredJerarquias.length }} rango{{ filteredJerarquias.length !== 1 ? 's' : '' }} disponible{{ filteredJerarquias.length !== 1 ? 's' : '' }}
                  </div>
                </div>

                <div>
                  <div class="text-caption font-weight-bold text-grey-darken-2 ml-1 mb-1">MIS Nº DE SVC</div>
                  <v-text-field
                    v-model="profile.svcNumber"
                    variant="solo-filled"
                    flat
                    density="compact"
                    rounded="lg"
                    placeholder="Ej. 45, 102..."
                    hide-details
                  />
                </div>
              </v-card>
            </v-col>

            <!-- COLUMNA DERECHA: IDENTIDAD -->
            <v-col cols="12" md="6">
              <v-card variant="outlined" border rounded="lg" class="pa-4 bg-white h-100">
                <div class="text-caption font-weight-black text-secondary mb-3 ls-1 text-overline">IDENTIDAD PERSONAL</div>

                <div class="mb-3">
                  <div class="text-caption font-weight-bold text-grey-darken-2 ml-1 mb-1">NOMBRE COMPLETO</div>
                  <v-text-field
                    v-model="profile.displayName"
                    variant="solo-filled"
                    flat
                    density="compact"
                    rounded="lg"
                    hide-details
                  />
                </div>

                <v-row density="comfortable">
                  <v-col cols="6">
                    <div class="mb-3">
                      <div class="text-caption font-weight-bold text-grey-darken-2 ml-1 mb-1">DNI</div>
                      <v-text-field
                        v-model="profile.dni"
                        variant="solo-filled"
                        flat
                        density="compact"
                        rounded="lg"
                        @input="formatDNI"
                        hide-details
                      />
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <div class="mb-3">
                      <div class="text-caption font-weight-bold text-grey-darken-2 ml-1 mb-1">EMAIL</div>
                      <v-text-field
                        v-model="profile.email"
                        variant="solo-filled"
                        flat
                        density="compact"
                        rounded="lg"
                        disabled
                        bg-color="grey-lighten-4"
                        hide-details
                      />
                    </div>
                  </v-col>
                </v-row>

                <div>
                  <div class="text-caption font-weight-bold text-grey-darken-2 ml-1 mb-1">TELÉFONO (+54 9)</div>
                  <v-text-field
                    v-model="profile.phone"
                    variant="solo-filled"
                    flat
                    density="compact"
                    rounded="lg"
                    prefix="+54 9"
                    hide-details
                  />
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-3 bg-white">
        <v-spacer />
        <v-btn variant="text" color="grey" size="small" @click="$emit('close')">Cerrar</v-btn>
        <v-btn
          color="primary"
          rounded="pill"
          size="large"
          class="px-10 font-weight-bold"
          :loading="saving"
          :disabled="!isValid"
          @click="save"
        >
          Guardar Cambios
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { doc, getDoc, updateDoc, collection, onSnapshot } from 'firebase/firestore'
import { db } from '../plugins/firebase'
import { useAuthStore } from '../modules/auth/stores/authStore'

interface JerarquiaDoc  { id: string; nombre: string; orden?: number }
interface ReparticionDoc { id: string; nombre: string; vinculaJerarquia?: boolean; allowedHierarchyIds?: string[] }

const props = defineProps<{ show: boolean }>()
const emit = defineEmits(['close', 'updated'])

const authStore = useAuthStore()
const isValid = ref(false)
const saving = ref(false)
const loadingLists = ref(true)
const loadingJer = ref(true)

const profile = ref({
  displayName: '',
  hierarchy: '',
  dni: '',
  email: '',
  phone: '',
  svcNumber: '',
  reparticion: ''
})

const reparticiones = ref<ReparticionDoc[]>([])
const jerarquias    = ref<JerarquiaDoc[]>([])

let unsubRep: any = null
let unsubJer: any = null

// Ordena por campo 'orden' numérico, con fallback alfabético por 'nombre'
const sortJerarquias = (list: JerarquiaDoc[]) =>
  [...list].sort((a, b) => {
    const aO = typeof a.orden === 'number' ? a.orden : 9999
    const bO = typeof b.orden === 'number' ? b.orden : 9999
    if (aO !== bO) return aO - bO
    return (a.nombre || '').localeCompare(b.nombre || '', 'es')
  })

// Jerarquías visibles según configuración de la repartición seleccionada
const filteredJerarquias = computed(() => {
  if (!profile.value.reparticion) return []
  const rep = reparticiones.value.find(r => r.id === profile.value.reparticion)
  // Reparticiones aún cargando → mostrar todas para no bloquear al usuario
  if (!rep) return jerarquias.value
  // Sin restricción de jerarquía → TODAS las de la colección
  if (!rep.vinculaJerarquia) return jerarquias.value
  // Con restricción → filtrar por allowedHierarchyIds
  const allowedIds: string[] = rep.allowedHierarchyIds || []
  // Si no se configuraron IDs → todas (sin restricción efectiva)
  if (allowedIds.length === 0) return jerarquias.value
  return jerarquias.value.filter(j => allowedIds.includes(j.id))
})

const formatDNI = (e: any) => {
  let val = e.target.value.replace(/\D/g, '').substring(0, 8)
  const parts: string[] = []
  if (val.length > 0) parts.push(val.substring(0, 2))
  if (val.length > 2) parts.push(val.substring(2, 5))
  if (val.length > 5) parts.push(val.substring(5, 8))
  profile.value.dni = parts.join('.')
}

onMounted(() => {
  // ── Reparticiones: sin orderBy → cliente ordena por nombre ──────────────
  unsubRep = onSnapshot(
    collection(db, 'reparticiones'),
    (snap) => {
      reparticiones.value = snap.docs
        .map(d => ({ id: d.id, ...(d.data() as Omit<ReparticionDoc, 'id'>) }))
        .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'))
      loadingLists.value = false
    },
    (err) => {
      console.error('[Mi Perfil] Error cargando reparticiones:', err)
      loadingLists.value = false
    }
  )

  // ── Jerarquías: sin orderBy en Firestore → evita requerir índice ────────
  // Ordenación completa en cliente (por 'orden', luego por 'nombre')
  unsubJer = onSnapshot(
    collection(db, 'jerarquias'),
    (snap) => {
      jerarquias.value = sortJerarquias(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<JerarquiaDoc, 'id'>) })))
      loadingJer.value = false
      console.log('[Mi Perfil] Jerarquías cargadas:', jerarquias.value.length)
    },
    (err) => {
      console.error('[Mi Perfil] Error cargando jerarquías:', err)
      loadingJer.value = false
    }
  )
})

onUnmounted(() => {
  unsubRep && unsubRep()
  unsubJer && unsubJer()
})

// Carga el perfil del usuario cada vez que se abre el modal
watch(() => props.show, async (isVisible) => {
  if (isVisible && authStore.user) {
    const userDoc = await getDoc(doc(db, 'users', authStore.user.uid))
    if (userDoc.exists()) {
      const data = userDoc.data()
      profile.value = {
        displayName: data.displayName || '',
        hierarchy:   data.hierarchy   || '',
        dni:         data.dni         || '',
        email:       authStore.user.email || '',
        phone:       data.phone       || '',
        svcNumber:   data.svcNumber   || '',
        reparticion: data.reparticion || ''
      }
    }
  }
})

const save = async () => {
  if (!authStore.user) return
  saving.value = true
  try {
    await updateDoc(doc(db, 'users', authStore.user.uid), {
      ...profile.value,
      updatedAt: new Date()
    })
    emit('updated')
    emit('close')
  } catch (err) {
    console.error('[Mi Perfil] Error guardando:', err)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.ls-1 { letter-spacing: 1px !important; }
.text-overline { font-size: 0.65rem !important; letter-spacing: 2px !important; }
</style>
