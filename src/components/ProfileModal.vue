<template>
  <v-dialog 
    :model-value="show" 
    @update:model-value="!persistent && $emit('close')"
    max-width="1000"
    :persistent="persistent"
    scrollable
  >
    <v-card rounded="xl" class="pa-2 bg-grey-lighten-5 overflow-hidden">
      <!-- HEADER -->
      <v-card-title class="d-flex align-center pb-2 pt-2 px-4">
        <v-avatar :color="getRoleColor(authStore.userRole)" variant="tonal" size="40" class="mr-3">
          <v-icon size="20">{{ getRoleIcon(authStore.userRole) }}</v-icon>
        </v-avatar>
        <div class="text-h6 font-weight-bold">Mi Perfil</div>
        <v-spacer />
        <v-btn v-if="!persistent" icon="mdi-close" variant="text" size="small" @click="$emit('close')"></v-btn>
      </v-card-title>

      <v-card-text style="height: 60vh;">
        <v-form ref="profileForm" v-model="formIsValid" @submit.prevent>
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
                  
                  <div class="d-flex flex-wrap gap-2 mb-2">
                    <v-chip
                      v-for="(svc, index) in profile.svcNumbers"
                      :key="index"
                      :closable="isAdminOrDesignador"
                      size="small"
                      color="primary"
                      variant="flat"
                      class="mr-2 mb-1"
                      @click:close="removeSvc(index)"
                      @click="isAdminOrDesignador && startEditSvc(index)"
                    >
                      <v-icon start size="14" v-if="isAdminOrDesignador">mdi-pencil</v-icon>
                      {{ svc }}
                    </v-chip>
                    
                    <v-chip
                      v-if="profile.svcNumbers.length === 0"
                      size="small"
                      variant="tonal"
                      color="grey"
                    >
                      Sin SVC asignados
                    </v-chip>
                  </div>

                  <v-text-field
                    v-if="isAdminOrDesignador"
                    ref="svcInputRef"
                    v-model="svcInput"
                    variant="solo-filled"
                    flat
                    opacity="1"
                    density="compact"
                    rounded="lg"
                    placeholder="Escribí el Nº y presioná Enter"
                    :class="{ 'highlight-svc': authStore.shouldFocusSvc }"
                    hide-details="auto"
                    append-inner-icon="mdi-plus-circle"
                    @click:append-inner="addSvc"
                    @keyup.enter="addSvc"
                  />
                  
                  <div class="text-caption text-grey ml-1 mt-1">
                    <template v-if="isAdminOrDesignador">
                      Agregá tus números de servicio (Presioná Enter para guardar)
                    </template>
                    <template v-else>
                      Identificadores asignados a tu perfil
                    </template>
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

      <v-card-actions class="pa-4 bg-white border-top">
        <v-btn variant="text" color="grey" class="px-6" @click="$emit('close')">Cancelar</v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          rounded="pill"
          size="large"
          variant="elevated"
          class="px-10 font-weight-bold"
          :loading="saving"
          @click="save"
        >
          Guardar y Continuar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- DIALOGO EDICIÓN SVC -->
  <v-dialog v-model="svcDialog" max-width="300">
    <v-card rounded="xl" class="pa-4">
      <v-card-title class="text-subtitle-1 font-weight-bold">Editar SVC</v-card-title>
      <v-card-text class="pa-2">
        <v-text-field
          v-model="editingSvcValue"
          variant="solo-filled"
          flat
          density="compact"
          rounded="lg"
          hide-details
          autofocus
          @keydown.enter="saveEditSvc"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" color="grey" @click="svcDialog = false">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" rounded="pill" @click="saveEditSvc">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- DIÁLOGO CONFLICTO DE PROPIEDAD -->
  <v-dialog v-model="conflictDialog.show" max-width="450" persistent>
    <v-card rounded="xl" class="pa-6 text-center">
      <v-avatar color="error" variant="tonal" size="64" class="mb-4">
        <v-icon size="32">mdi-account-alert</v-icon>
      </v-avatar>
      <v-card-title class="text-h6 font-weight-black lh-1 mb-2">
        Este Nº de SVC ya tiene un titular
      </v-card-title>
      <v-card-text class="text-body-1 py-4 text-grey-darken-3">
        El servicio <span class="font-weight-black text-primary">{{ conflictDialog.svc }}</span> le pertenece al designador:<br>
        <div class="bg-grey-lighten-4 pa-3 rounded-lg my-3 border">
          <div class="font-weight-black text-black">{{ conflictDialog.ownerName }}</div>
          <div class="text-caption text-grey-darken-1">{{ conflictDialog.ownerHierarchy }}</div>
        </div>
        Si querés designar turnos con este número, comunicate con él para que lo elimine de su perfil.
      </v-card-text>
      <v-card-actions class="flex-column ga-2 pb-2">
        <v-btn
          block
          color="success"
          variant="elevated"
          rounded="pill"
          size="large"
          class="font-weight-bold"
          prepend-icon="mdi-whatsapp"
          @click="contactOwner"
        >
          Comunicarme con él
        </v-btn>
        <v-btn
          block
          variant="text"
          color="grey"
          class="font-weight-bold"
          @click="conflictDialog.show = false"
        >
          Cancelar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, collection, onSnapshot } from 'firebase/firestore'
import { db } from '../plugins/firebase'
import { useAuthStore } from '../modules/auth/stores/authStore'

interface JerarquiaDoc  { id: string; nombre: string; orden?: number }
interface ReparticionDoc { id: string; nombre: string; vinculaJerarquia?: boolean; allowedHierarchyIds?: string[] }

const props = defineProps<{ 
  show: boolean,
  persistent?: boolean 
}>()
const emit = defineEmits(['close', 'updated'])

const authStore = useAuthStore()
const saving = ref(false)
const svcInputRef = ref<any>(null)
const formIsValid = ref(false)
const loadingLists = ref(true)
const loadingJer = ref(true)

const profile = ref({
  displayName: '',
  hierarchy: '',
  dni: '',
  email: '',
  phone: '',
  svcNumbers: [] as string[],
  reparticion: '',
  role: 3 as number // Default to Asignado
})

const svcInput = ref('')
const editingSvcIndex = ref<number | null>(null)
const editingSvcValue = ref('')
const svcDialog = ref(false)

const conflictDialog = ref({
  show: false,
  svc: '',
  ownerName: '',
  ownerHierarchy: '',
  ownerPhone: ''
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
      let svcNumbers: string[] = []
      if (data.svcNumbers && Array.isArray(data.svcNumbers)) {
        svcNumbers = data.svcNumbers
      } else if (data.svcNumber) {
        svcNumbers = [data.svcNumber]
      }

      profile.value = {
        displayName: data.displayName || '',
        hierarchy:   data.hierarchy   || '',
        dni:         data.dni         || '',
        email:       authStore.user.email || '',
        phone:       data.phone       || '',
        svcNumbers:  svcNumbers,
        reparticion: data.reparticion || '',
        role:        data.role        || 3
      }

      if (authStore.shouldFocusSvc) {
        profile.value.role = 2 // Forzar rol a Designador si viene de subscripción
        nextTick(() => {
          if (svcInputRef.value) {
            svcInputRef.value.focus()
          }
        })
      }
    }
  }
}, { immediate: true })

const isAdminOrDesignador = computed(() => {
  return [1, 2].includes(profile.value.role as number)
})

const addSvc = async () => {
  if (!isAdminOrDesignador.value) return
  const val = svcInput.value.trim()
  if (!val) return
  
  if (profile.value.svcNumbers.includes(val)) {
    svcInput.value = ''
    return
  }

  // 1. VALIDACIÓN DE PROPIEDAD
  try {
    const svcRef = doc(db, 'svcs', val)
    const svcSnap = await getDoc(svcRef)
    
    if (svcSnap.exists()) {
      const data = svcSnap.data()
      // Si el SVC tiene un dueño diferente al actual
      if (data.ownerUid && data.ownerUid !== authStore.user!.uid) {
        conflictDialog.value = {
          show: true,
          svc: val,
          ownerName: data.ownerName || 'Desconocido',
          ownerHierarchy: data.ownerHierarchy || 'Designador',
          ownerPhone: data.ownerPhone || ''
        }
        return
      }
    }
  } catch (err) {
    console.warn('[Profile] Error verificando propiedad de SVC:', err)
  }

  // 2. ACTUALIZACIÓN VISUAL INMEDIATA
  profile.value.svcNumbers.push(val)
  svcInput.value = ''

  try {
    // 3. GUARDADO EN PERFIL
    await updateDoc(doc(db, 'users', authStore.user!.uid), {
      svcNumbers: profile.value.svcNumbers,
      updatedAt: serverTimestamp()
    })

    // 4. ACTUALIZAR METADATOS EN COLECCIÓN CENTRAL
    const svcRef = doc(db, 'svcs', val)
    await setDoc(svcRef, {
      number: val,
      lastUsedAt: serverTimestamp(),
      ownerUid: authStore.user!.uid,
      ownerName: profile.value.displayName,
      ownerHierarchy: profile.value.hierarchy,
      ownerPhone: profile.value.phone,
      reparticionId: profile.value.reparticion
    }, { merge: true })

  } catch (err) {
    console.error('[Profile] Error crítico al guardar en perfil:', err)
    profile.value.svcNumbers = profile.value.svcNumbers.filter(s => s !== val)
    alert('No se pudo guardar el SVC. Verificá tu conexión.')
  }
}

const contactOwner = () => {
  if (!conflictDialog.value.ownerPhone) return
  // Formatear número para WhatsApp (asumiendo formato argentino)
  const phone = conflictDialog.value.ownerPhone.replace(/\D/g, '')
  const msg = encodeURIComponent(`Hola ${conflictDialog.value.ownerName}, te contacto desde Alfita. Necesito usar el Nº de SVC ${conflictDialog.value.svc} que figura a tu nombre. ¿Podrías eliminarlo de tu perfil? Gracias!`)
  window.open(`https://wa.me/549${phone}?text=${msg}`, '_blank')
}

const removeSvc = async (index: number) => {
  if (!isAdminOrDesignador.value) return
  profile.value.svcNumbers.splice(index, 1)
  
  try {
    await updateDoc(doc(db, 'users', authStore.user!.uid), {
      svcNumbers: profile.value.svcNumbers,
      updatedAt: serverTimestamp()
    })
  } catch (err) {
    console.error('[Profile] Error al eliminar SVC:', err)
  }
}

const startEditSvc = (index: number) => {
  if (!isAdminOrDesignador.value) return
  editingSvcIndex.value = index
  editingSvcValue.value = profile.value.svcNumbers[index]
  svcDialog.value = true
}

const saveEditSvc = async () => {
  const val = editingSvcValue.value.trim()
  if (val && editingSvcIndex.value !== null) {
    // Validar duplicado (excluyendo el que estamos editando)
    const exists = profile.value.svcNumbers.some((s, idx) => s === val && idx !== editingSvcIndex.value)
    if (!exists) {
      profile.value.svcNumbers[editingSvcIndex.value] = val
      
      // Registrar en colección central
      try {
        await setDoc(doc(db, 'svcs', val), {
          number: val,
          lastUsedAt: serverTimestamp(),
          updatedBy: authStore.user!.uid
        }, { merge: true })
      } catch (err) {
        console.warn('[Profile] Error actualizando SVC central:', err)
      }
    }
  }
  svcDialog.value = false
  editingSvcIndex.value = null
}

const getRoleColor = (role: any) => {
  switch (role) {
    case 1: return 'deep-purple-lighten-5'
    case 2: return 'amber-lighten-4'
    case 3: return 'green-lighten-5'
    default: return 'primary'
  }
}

const getRoleIcon = (role: any) => {
  switch (role) {
    case 1: return 'mdi-shield-crown'
    case 2: return 'mdi-account-star'
    case 3: return 'mdi-account-tie'
    default: return 'mdi-account-circle-outline'
  }
}

const save = async () => {
  if (!authStore.user) return
  saving.value = true
  try {
    // Validación de SVC para Designadores
    if (profile.value.role === 2 && profile.value.svcNumbers.length === 0) {
      // Si llegamos aquí, el botón Guardar debería estar habilitado según isValid, 
      // pero forzamos la validación extra
      alert('Como Designador, debés tener al menos un Número de Servicio.')
      saving.value = false
      return
    }

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
.highlight-svc {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
  animation: pulse-border 2s infinite;
  border-radius: 8px;
}
@keyframes pulse-border {
  0% { outline-color: rgba(var(--v-theme-primary), 0.5); }
  50% { outline-color: rgba(var(--v-theme-primary), 1); }
  100% { outline-color: rgba(var(--v-theme-primary), 0.5); }
}
</style>
