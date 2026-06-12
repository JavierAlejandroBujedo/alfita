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
          <v-row dense>
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
                    hide-details
                  />
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

                <v-row dense>
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
import { doc, getDoc, updateDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../plugins/firebase'
import { useAuthStore } from '../modules/auth/stores/authStore'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits(['close', 'updated'])

const authStore = useAuthStore()
const isValid = ref(false)
const saving = ref(false)
const loadingLists = ref(true)

const profile = ref({
  displayName: '',
  hierarchy: '',
  dni: '',
  email: '',
  phone: '',
  svcNumber: '',
  reparticion: ''
})

const reparticiones = ref<any[]>([])
const jerarquias = ref<any[]>([])

let unsubRep: any = null
let unsubJer: any = null

const filteredJerarquias = computed(() => {
  if (!profile.value.reparticion) return []
  const rep = reparticiones.value.find(r => r.id === profile.value.reparticion)
  if (!rep) return []
  if (!rep.vinculaJerarquia) return jerarquias.value
  const allowedIds = rep.allowedHierarchyIds || []
  return jerarquias.value.filter(j => allowedIds.includes(j.id))
})

const formatDNI = (e: any) => {
  let val = e.target.value.replace(/\D/g, '').substring(0, 8)
  const parts = []
  if (val.length > 0) parts.push(val.substring(0, 2))
  if (val.length > 2) parts.push(val.substring(2, 5))
  if (val.length > 5) parts.push(val.substring(5, 8))
  profile.value.dni = parts.join('.')
}

onMounted(() => {
  // Sincronización en tiempo real para que los cambios en Configuración se vean al instante
  const qRep = query(collection(db, 'reparticiones'), orderBy('nombre', 'asc'))
  unsubRep = onSnapshot(qRep, (snap) => {
    reparticiones.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    loadingLists.value = false
  }, (err) => {
    console.error("Error cargando reparticiones:", err)
    loadingLists.value = false
  })

  const qJer = query(collection(db, 'jerarquias'), orderBy('nombre', 'asc'))
  unsubJer = onSnapshot(qJer, (snap) => {
    jerarquias.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }, (err) => {
    console.error("Error cargando jerarquias:", err)
  })
})

onUnmounted(() => {
  unsubRep && unsubRep()
  unsubJer && unsubJer()
})

watch(() => props.show, async (isVisible) => {
  if (isVisible && authStore.user) {
    const userDoc = await getDoc(doc(db, 'users', authStore.user.uid))
    if (userDoc.exists()) {
      const data = userDoc.data()
      profile.value = {
        displayName: data.displayName || '',
        hierarchy: data.hierarchy || '',
        dni: data.dni || '',
        email: authStore.user.email || '',
        phone: data.phone || '',
        svcNumber: data.svcNumber || '',
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
    console.error(err)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.ls-1 { letter-spacing: 1px !important; }
.text-overline { font-size: 0.65rem !important; letter-spacing: 2px !important; }
</style>
