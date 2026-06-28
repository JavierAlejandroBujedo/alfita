<template>
  <v-dialog 
    :model-value="show" 
    @update:model-value="$emit('close')" 
    max-width="1100" 
    scrollable
    :fullscreen="isMobile"
  >
    <v-card rounded="xl" class="pa-4 bg-grey-lighten-5">
      <!-- HEADER -->
      <v-card-title class="d-flex align-center pb-6">
        <v-avatar color="primary" variant="tonal" size="56" class="mr-4">
          <v-icon :icon="user?.role === 1 ? 'mdi-shield-crown' : (user?.role === 2 ? 'mdi-account-star' : 'mdi-account-tie')"></v-icon>
        </v-avatar>
        <div class="flex-grow-1">
          <div class="text-h6 font-weight-bold">Ficha de Usuario</div>
          <div class="d-flex align-center">
            <span v-if="user?.role !== 1" class="text-caption font-weight-medium text-primary">
              Membresía: {{ getMembershipText() }}
            </span>
          </div>
        </div>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="$emit('close')"></v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- INFO DE MEMBRESIA Y DIAS RESTANTES (Solo No-Admins) -->
        <v-alert
          v-if="user?.role !== 1"
          variant="tonal"
          :color="daysRemaining > 5 ? 'secondary' : 'error'"
          rounded="lg"
          class="mb-6"
          density="comfortable"
        >
          <v-row align="center" no-gutters>
            <v-col cols="12" sm="8" class="d-flex flex-wrap pa-2" style="gap: 20px">
              <div class="text-caption">
                <v-icon size="14" class="mr-1">mdi-star-circle</v-icon>
                <strong>Plan:</strong> {{ localData.membershipType || 'GRATIS' }}
              </div>
              <div class="text-caption">
                <v-icon size="14" class="mr-1">mdi-calendar-check</v-icon>
                <strong>Último Pago:</strong> {{ formatDate(user?.lastPaymentDate) }}
              </div>
            </v-col>
            <v-col cols="12" sm="4" class="text-sm-right pa-2">
              <v-chip 
                :color="daysRemaining > 5 ? 'secondary' : 'error'" 
                variant="flat" 
                size="small"
                class="font-weight-black"
              >
                {{ daysRemainingText }}
              </v-chip>
            </v-col>
          </v-row>
        </v-alert>

        <v-form ref="formRef" v-model="isValid">
          <v-row>
            <!-- COLUMNA IZQUIERDA: DATOS DE SERVICIO -->
            <v-col cols="12" md="6">
              <v-card variant="outlined" border rounded="xl" class="pa-6 bg-white h-100">
                <div class="text-overline font-weight-black text-primary mb-6">DATOS ESTRUCTURALES</div>
                
                <!-- Membresía -->
                <div class="mb-5" v-if="user?.role !== 1">
                  <div class="text-caption font-weight-bold text-grey-darken-2 ml-2 mb-1">TIPO DE MEMBRESÍA</div>
                  <v-select
                    v-model="localData.membershipType"
                    :items="['GRATIS', 'Estandar', 'Alfa', 'PRO']"
                    variant="solo-filled"
                    flat
                    rounded="lg"
                    density="comfortable"
                    append-inner-icon="mdi-star"
                    hide-details
                  />
                </div>

                <div class="mb-5">
                  <div class="text-caption font-weight-bold text-grey-darken-2 ml-2 mb-1">REPARTICIÓN</div>
                  <v-select
                    v-model="localData.reparticion"
                    :items="reparticiones"
                    item-title="nombre"
                    item-value="id"
                    variant="solo-filled"
                    flat
                    rounded="lg"
                    density="comfortable"
                    placeholder="Cargando unidades..."
                    append-inner-icon="mdi-bank"
                    :loading="loadingLists"
                    hide-details
                    @update:model-value="onReparticionChange"
                  />
                </div>

                <div class="mb-5">
                  <div class="text-caption font-weight-bold text-grey-darken-2 ml-2 mb-1">JERARQUÍA</div>
                  <v-select
                    v-model="localData.hierarchy"
                    :items="filteredJerarquias"
                    item-title="nombre"
                    item-value="nombre"
                    variant="solo-filled"
                    flat
                    rounded="lg"
                    density="comfortable"
                    placeholder="Seleccione rango"
                    append-inner-icon="mdi-medal"
                    :disabled="!localData.reparticion"
                    hide-details
                  />
                </div>

                <div>
                  <div class="text-caption font-weight-bold text-grey-darken-2 ml-2 mb-1">Nº DE SVC</div>
                  
                  <div class="d-flex flex-wrap gap-2 mb-2 px-2">
                    <v-chip
                      v-for="(svc, index) in localData.svcNumbers"
                      :key="index"
                      closable
                      size="small"
                      color="primary"
                      variant="flat"
                      class="mr-2 mb-1"
                      @click="startEditSvc(index)"
                      @click:close="removeSvc(index)"
                    >
                      {{ svc }}
                    </v-chip>
                  </div>

                  <v-text-field
                    v-model="svcInput"
                    variant="solo-filled"
                    flat
                    rounded="lg"
                    density="comfortable"
                    placeholder="Agregar Nº SVC..."
                    append-inner-icon="mdi-plus"
                    hide-details="auto"
                    @click:append-inner="addSvc"
                    @keydown.enter.prevent="addSvc"
                  />
                </div>
              </v-card>
            </v-col>

            <!-- COLUMNA DERECHA: DATOS PERSONALES -->
            <v-col cols="12" md="6">
              <v-card variant="outlined" border rounded="xl" class="pa-6 bg-white h-100">
                <div class="text-overline font-weight-black text-secondary mb-6">IDENTIDAD DEL USUARIO</div>

                <div class="mb-5">
                  <div class="text-caption font-weight-bold text-grey-darken-2 ml-2 mb-1">NOMBRE COMPLETO</div>
                  <v-text-field
                    v-model="localData.displayName"
                    variant="solo-filled"
                    flat
                    rounded="lg"
                    density="comfortable"
                    append-inner-icon="mdi-pencil"
                    hide-details
                  />
                </div>

                <v-row dense>
                  <v-col cols="12" sm="6">
                    <div class="mb-5">
                      <div class="text-caption font-weight-bold text-grey-darken-2 ml-2 mb-1">DNI</div>
                      <v-text-field
                        v-model="localData.dni"
                        variant="solo-filled"
                        flat
                        rounded="lg"
                        density="comfortable"
                        append-inner-icon="mdi-pencil"
                        @input="formatDNI"
                        hide-details
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="mb-5">
                      <div class="text-caption font-weight-bold text-grey-darken-2 ml-2 mb-1">GMAIL</div>
                      <v-text-field
                        v-model="localData.personalEmail"
                        variant="solo-filled"
                        flat
                        rounded="lg"
                        density="comfortable"
                        append-inner-icon="mdi-pencil"
                        :rules="[v => !v || v.endsWith('@gmail.com')]"
                        hide-details="auto"
                      />
                    </div>
                  </v-col>
                </v-row>

                <div>
                  <div class="text-caption font-weight-bold text-grey-darken-2 ml-2 mb-1">TELÉFONO (+54 9)</div>
                  <v-text-field
                    v-model="localData.phone"
                    variant="solo-filled"
                    flat
                    rounded="lg"
                    density="comfortable"
                    prefix="+54 9"
                    append-inner-icon="mdi-pencil"
                    hide-details
                  />
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-6">
        <v-spacer />
        <v-btn variant="text" color="grey" @click="$emit('close')" class="text-none">Cerrar ficha</v-btn>
        <v-btn
          variant="flat"
          color="primary"
          rounded="pill"
          size="large"
          class="px-12 font-weight-bold"
          :disabled="!isValid"
          @click="save"
        >
          Guardar Cambios
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
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../../plugins/firebase'

const props = defineProps<{ show: boolean, user: any }>()
const emit = defineEmits(['close', 'save'])
const { mobile: isMobile } = useDisplay()
const isValid = ref(false)

const reparticiones = ref<any[]>([])
const jerarquias = ref<any[]>([])
const loadingLists = ref(true)

const localData = ref({
  hierarchy: '',
  displayName: '',
  dni: '',
  personalEmail: '',
  phone: '',
  svcNumbers: [] as string[],
  reparticion: '',
  role: 3 as number,
  membershipType: 'GRATIS'
})

const svcInput = ref('')
const editingSvcIndex = ref<number | null>(null)
const editingSvcValue = ref('')
const svcDialog = ref(false)

const filteredJerarquias = computed(() => {
  if (!localData.value.reparticion) return []
  const rep = reparticiones.value.find(r => r.id === localData.value.reparticion)
  if (!rep) return []
  
  if (!rep.vinculaJerarquia) return jerarquias.value
  
  const allowedIds = rep.allowedHierarchyIds || []
  return jerarquias.value.filter(j => allowedIds.includes(j.id))
})

const daysRemaining = computed(() => {
  if (!props.user?.expiryDate) return 0
  const expiry = props.user.expiryDate.toDate ? props.user.expiryDate.toDate() : new Date(props.user.expiryDate)
  const diff = expiry.getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const daysRemainingText = computed(() => {
  const days = daysRemaining.value
  if (days < 0) return 'MEMBRESÍA VENCIDA'
  if (days === 0) return 'VENCE HOY'
  return `${days} DÍAS RESTANTES`
})

const getMembershipText = () => {
  if (props.user?.role === 1) return 'ADMINISTRADOR'
  return localData.value.membershipType || 'GRATIS'
}

onMounted(async () => {
  try {
    const [snapRep, snapJer] = await Promise.all([
      getDocs(query(collection(db, 'reparticiones'), orderBy('nombre', 'asc'))),
      getDocs(query(collection(db, 'jerarquias'), orderBy('nombre', 'asc')))
    ])
    reparticiones.value = snapRep.docs.map(d => ({ id: d.id, ...d.data() }))
    jerarquias.value = snapJer.docs.map(d => ({ id: d.id, ...d.data() }))
  } finally {
    loadingLists.value = false
  }
})

watch(() => props.user, (newVal) => {
  if (newVal) {
    let svcNumbers: string[] = []
    if (newVal.svcNumbers && Array.isArray(newVal.svcNumbers)) {
      svcNumbers = newVal.svcNumbers
    } else if (newVal.svcNumber) {
      svcNumbers = [newVal.svcNumber]
    }

    localData.value = { 
      ...newVal, 
      svcNumbers: svcNumbers,
      membershipType: newVal.membershipType || 'GRATIS' 
    }
  }
}, { immediate: true })

const addSvc = async () => {
  const val = svcInput.value.trim()
  if (!val) return
  
  // Limites por membresía (Solo si el usuario en edición es Designador y no Admin)
  if (localData.value.role === 2) {
    const isAlfa = localData.value.membershipType === 'ALFA'
    if (!isAlfa && localData.value.svcNumbers.length >= 1) {
      alert('Este usuario ya tiene un SVC asignado. Requiere membresía ALFA para tener más de uno.')
      return
    }
  }

  if (localData.value.svcNumbers.includes(val)) {
    svcInput.value = ''
    return
  }

  // Registrar en colección central y verificar titularidad
  try {
    const { setDoc, serverTimestamp, doc: fsDoc } = await import('firebase/firestore')
    const svcRef = fsDoc(db, 'svcs', val)

    // Delegación automática: Si el Admin lo asigna a este usuario, este usuario se vuelve el titular
    await setDoc(svcRef, {
      number: val,
      lastUsedAt: serverTimestamp(),
      ownerUid: props.user.uid, // Delegación directa del Admin
      updatedByAdmin: true 
    }, { merge: true })

    if (!localData.value.svcNumbers) localData.value.svcNumbers = []
    localData.value.svcNumbers.push(val)
    svcInput.value = ''
  } catch (err) {
    console.warn('[AdminModal] Error registrando SVC central:', err)
  }
}

const removeSvc = (index: number) => {
  localData.value.svcNumbers.splice(index, 1)
}

const startEditSvc = (index: number) => {
  editingSvcIndex.value = index
  editingSvcValue.value = localData.value.svcNumbers[index]
  svcDialog.value = true
}

const saveEditSvc = async () => {
  const val = editingSvcValue.value.trim()
  if (val && editingSvcIndex.value !== null) {
    const exists = localData.value.svcNumbers.some((s, idx) => s === val && idx !== editingSvcIndex.value)
    if (!exists) {
      localData.value.svcNumbers[editingSvcIndex.value] = val
      
      // Registrar en colección central
      try {
        const { setDoc, serverTimestamp, doc } = await import('firebase/firestore')
        await setDoc(doc(db, 'svcs', val), {
          number: val,
          lastUsedAt: serverTimestamp(),
          updatedByAdmin: true
        }, { merge: true })
      } catch (err) {
        console.warn('[AdminModal] Error actualizando SVC central:', err)
      }
    }
  }
  svcDialog.value = false
  editingSvcIndex.value = null
}

const onReparticionChange = () => localData.value.hierarchy = ''

const formatDNI = (e: any) => {
  let val = e.target.value.replace(/\D/g, '').substring(0, 8)
  const parts = []
  if (val.length > 0) parts.push(val.substring(0, 2))
  if (val.length > 2) parts.push(val.substring(2, 5))
  if (val.length > 5) parts.push(val.substring(5, 8))
  localData.value.dni = parts.join('.')
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return '---'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('es-AR')
}

const save = () => emit('save', { ...localData.value })
</script>

<style scoped>
.v-card { transition: all 0.2s ease; }
.text-overline { letter-spacing: 3px !important; }
</style>
