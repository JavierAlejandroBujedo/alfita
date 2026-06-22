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
        <v-avatar :color="getRoleColor(authStore.userRole)" variant="tonal" size="40" class="mr-3">
          <v-icon size="20">{{ getRoleIcon(authStore.userRole) }}</v-icon>
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
                    :rules="[rules.required]"
                    hide-details="auto"
                    class="mb-3"
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
                    :disabled="loadingJer"
                    :loading="loadingJer"
                    :rules="[rules.required]"
                    no-data-text="Sin jerarquías disponibles para esta repartición"
                    hide-details="auto"
                  />
                  <div v-if="!loadingJer" class="text-caption text-grey ml-1 mt-1">
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
                    hide-details="auto"
                  />
                  <div class="text-caption text-grey ml-1 mt-1">
                    Tus identificadores en los servicios asignados
                  </div>
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
                    :rules="nameRules"
                    maxlength="26"
                    placeholder="Nombre y Apellido"
                    hide-details="auto"
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
                        maxlength="10"
                        @input="formatDNI"
                        :rules="[rules.required, rules.dni]"
                        placeholder="00.000.000"
                        hide-details="auto"
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
                    :rules="[rules.required, rules.phone]"
                    maxlength="10"
                    placeholder="3811234567"
                    hide-details="auto"
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

// Jerarquías visibles según configuración de la repartición seleccionada
const rules = {
  required: (v: any) => !!v || 'Campo obligatorio',
  dni: (v: string) => /^\d{2}\.\d{3}\.\d{3}$/.test(v) || 'Formato 00.000.000',
  phone: (v: string) => /^[23]\d{9}$/.test(v) || '10 dígitos (Ej: 381...)'
}

const nameRules = [
  (v: string) => !!v || 'Campo obligatorio',
  (v: string) => v.trim().split(/\s+/).length >= 2 || 'Ingresá nombre y apellido',
  (v: string) => (v.length >= 3 && v.length <= 26) || 'Entre 3 y 26 caracteres'
]

const filteredJerarquias = computed(() => {
  let list = jerarquias.value
  
  if (profile.value.reparticion) {
    const rep = reparticiones.value.find(r => r.id === profile.value.reparticion)
    if (rep && rep.vinculaJerarquia) {
      const allowedIds = rep.allowedHierarchyIds || []
      if (allowedIds.length > 0) {
        list = jerarquias.value.filter(j => allowedIds.includes(j.id))
      }
    }
  }

  // Garantizar que la jerarquía actual del usuario esté en la lista para evitar campos vacíos
  if (profile.value.hierarchy) {
    const exists = list.some(j => j.nombre === profile.value.hierarchy)
    if (!exists) {
      const master = jerarquias.value.find(j => j.nombre === profile.value.hierarchy)
      if (master) {
        list = [...list, master]
      }
    }
  }

  return list
})

const formatDNI = (e: any) => {
  const input = e.target.value || ''
  const val = input.replace(/\D/g, '').substring(0, 8)
  const parts: string[] = []
  if (val.length > 0) parts.push(val.substring(0, 2))
  if (val.length > 2) parts.push(val.substring(2, 5))
  if (val.length > 5) parts.push(val.substring(5, 8))
  profile.value.dni = parts.join('.')
}

onMounted(() => {
  // ── Reparticiones ────────────────────────────────────────────────────────
  unsubRep = onSnapshot(
    collection(db, 'reparticiones'),
    (snap) => {
      reparticiones.value = snap.docs
        .map(d => ({ id: d.id, ...(d.data() as any) }))
        .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'))
      loadingLists.value = false
    },
    (err) => {
      console.error('[Mi Perfil] Error cargando reparticiones:', err)
      loadingLists.value = false
    }
  )

  // ── Jerarquías (Carga con Ordenamiento en Cliente) ──────────────────────
  unsubJer = onSnapshot(
    collection(db, 'jerarquias'),
    (snap) => {
      // Obtenemos los datos raw
      const rawDocs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
      
      // Ordenamos en cliente: primero por 'orden' (numérico), luego por 'nombre'
      jerarquias.value = rawDocs.sort((a, b) => {
        const ordenA = typeof a.orden === 'number' ? a.orden : 9999
        const ordenB = typeof b.orden === 'number' ? b.orden : 9999
        if (ordenA !== ordenB) return ordenA - ordenB
        return (a.nombre || '').localeCompare(b.nombre || '', 'es')
      })
      
      loadingJer.value = false
    },
    (err) => {
      console.error('[Mi Perfil] Error cargando jerarquías:', err)
      loadingJer.value = false
    }
  )
})

onUnmounted(() => {
  if (unsubRep) unsubRep()
  if (unsubJer) unsubJer()
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
}, { immediate: true })

const getRoleColor = (role: any) => {
  switch (role) {
    case 1: return 'deep-purple-lighten-5'
    case 2: return 'blue-lighten-5'
    case 3: return 'amber-lighten-4'
    case 4: return 'green-lighten-5'
    default: return 'primary'
  }
}

const getRoleIcon = (role: any) => {
  switch (role) {
    case 1: return 'mdi-shield-crown'
    case 2: return 'mdi-account-heart-outline'
    case 3: return 'mdi-account-star'
    case 4: return 'mdi-account-tie'
    default: return 'mdi-account-circle-outline'
  }
}

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
