<template>
  <v-dialog :model-value="show" max-width="750" persistent transition="dialog-bottom-transition">
    <v-card rounded="xl" class="pa-4">
      <v-card-title class="d-flex align-center px-2">
        <v-icon color="primary" class="mr-3">mdi-email-send-outline</v-icon>
        <span class="text-h6 font-weight-black">Solicitar Disponibilidad</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')"></v-btn>
      </v-card-title>

      <v-card-text class="pa-2">
        <p class="text-body-2 text-grey-darken-1 mb-4">
          Ingresá los correos electrónicos del personal al que deseas solicitar disponibilidad.
          Cada correo quedará vinculado al Nº de servicio hasta que lo desvincules.
        </p>

        <!-- CHECKBOX PARA INCLUIRSE A SÍ MISMO -->
        <v-checkbox
          v-model="includeSelf"
          color="primary"
          density="compact"
          hide-details
          class="mb-3"
        >
          <template #label>
            <span class="text-body-2 font-weight-medium">
              Incluirme a mí también
              <span class="text-grey">({{ currentUserEmail }})</span>
            </span>
          </template>
        </v-checkbox>

        <!-- CAMPO PARA AGREGAR CORREO -->
        <div class="d-flex ga-2 mb-4">
          <v-text-field
            v-model="newEmail"
            label="Agregar correo electrónico"
            placeholder="ejemplo@correo.com"
            variant="solo-filled"
            flat rounded="lg"
            density="compact"
            hide-details
            :error="emailError !== ''"
            :messages="emailError"
            @keyup.enter="addEmail"
          />
          <v-btn color="primary" variant="elevated" rounded="lg" @click="addEmail" :disabled="!isValidEmail">
            Añadir
          </v-btn>
        </div>

        <!-- LISTA DE CORREOS -->
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-caption font-weight-bold text-primary">PERSONAL EN LA LISTA: {{ emailList.length }}</div>
          
          <!-- BOTÓN IMPORTACIÓN POR LOTE -->
          <v-menu v-if="availableSheets.length > 1">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                variant="text"
                prepend-icon="mdi-account-arrow-left"
                color="primary"
                size="small"
                class="font-weight-bold text-none"
              >
                Importar personal de...
              </v-btn>
            </template>
            <v-list density="compact" rounded="lg">
              <v-list-subheader class="font-weight-bold">SELECCIONAR SERVICIO ORIGEN</v-list-subheader>
              <v-list-item
                v-for="sheet in availableSheets"
                :key="sheet.id"
                :title="sheet.label"
                @click="importFromService(sheet.id)"
              >
                <template #prepend>
                  <v-icon size="20" color="grey">mdi-file-document-outline</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <div class="emails-list-container border-black pa-2 rounded-lg mb-4 bg-grey-lighten-5" style="max-height: 200px; overflow-y: auto;">
          <div v-if="emailList.length === 0" class="text-center py-6 text-grey">
            <v-icon size="28" class="mb-2" color="grey-lighten-1">mdi-email-outline</v-icon>
            <div class="text-body-2">No hay correos en la lista.<br>Agregá correos manualmente o importá de otro servicio.</div>
          </div>
          <v-chip
            v-for="(email, idx) in emailList"
            :key="idx"
            closable
            :color="email === currentUserEmail ? 'amber-darken-2' : 'primary'"
            variant="tonal"
            class="ma-1 font-weight-bold"
            @click:close="removeEmail(idx)"
          >
            <v-icon start size="16">{{ email === currentUserEmail ? 'mdi-account-star' : 'mdi-account' }}</v-icon>
            {{ email }}
          </v-chip>
          
          <div v-if="isImporting" class="text-center py-2">
            <v-progress-circular indeterminate size="16" width="2" color="primary"></v-progress-circular>
            <span class="text-caption ml-2 text-primary">Importando...</span>
          </div>
        </div>

        <!-- SELECCIONAR HOJA DE SERVICIO VINCULADA -->
        <v-select
          v-model="selectedServiceId"
          :items="availableSheets"
          item-title="label"
          item-value="id"
          label="Vincular al Nº de Servicio"
          variant="solo-filled"
          flat rounded="lg"
          density="compact"
          hide-details
          class="mb-4"
          prepend-inner-icon="mdi-link-variant"
          :rules="[v => !!v || 'Seleccioná una hoja de servicio']"
        >
          <template #item="{ props: itemProps }">
            <v-list-item v-bind="itemProps">
              <template #prepend>
                <v-icon color="primary" size="20">mdi-file-document</v-icon>
              </template>
            </v-list-item>
          </template>
        </v-select>

        <!-- MENSAJE OPCIONAL -->
        <v-textarea
          v-model="message"
          label="Mensaje o nota opcional"
          placeholder="Ej: Disponibilidad para el próximo fin de semana..."
          variant="solo-filled"
          flat rounded="lg"
          rows="3"
          no-resize
          class="mb-2"
        />
      </v-card-text>

      <v-card-actions class="px-2 pb-2">
        <v-btn
          block
          color="primary"
          size="large"
          variant="elevated"
          rounded="pill"
          class="font-weight-bold"
          :loading="loading"
          @click="handleSend"
          :disabled="emailList.length === 0 || !selectedServiceId"
        >
          <v-icon start>mdi-send</v-icon>
          Enviar Solicitud ({{ emailList.length }})
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../../plugins/firebase'
import { useAuthStore } from '../../../modules/auth/stores/authStore'

const authStore = useAuthStore()

const props = defineProps<{
  show: boolean
  loading?: boolean
  sheets?: any[] // Las hojas de servicio disponibles
}>()

const emit = defineEmits(['close', 'send'])

const newEmail = ref('')
const message = ref('')
const emailList = ref<string[]>([])
const includeSelf = ref(false)
const selectedServiceId = ref<string | null>(null)
const emailError = ref('')
const isImporting = ref(false)

const currentUserEmail = computed(() => authStore.userData?.email || authStore.user?.email || '')

const availableSheets = computed(() => {
  if (!props.sheets) return []
  return props.sheets.map(s => ({
    id: s.id,
    label: `SVC ${s.svcNumber || '---'} — ${s.month} ${s.year}`
  }))
})

const isValidEmail = computed(() => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(newEmail.value)
})

// Controlar checkbox de incluirse a sí mismo
watch(includeSelf, (checked) => {
  const selfEmail = currentUserEmail.value
  if (!selfEmail) return

  if (checked && !emailList.value.includes(selfEmail)) {
    emailList.value.unshift(selfEmail) // Se agrega al inicio
  } else if (!checked) {
    const idx = emailList.value.indexOf(selfEmail)
    if (idx >= 0) emailList.value.splice(idx, 1)
  }
})

watch(() => props.show, (isVisible) => {
  if (isVisible) {
    // Empezar con lista vacía siempre
    emailList.value = []
    message.value = ''
    newEmail.value = ''
    includeSelf.value = false
    selectedServiceId.value = null
    emailError.value = ''
  }
})

const addEmail = () => {
  emailError.value = ''

  if (!isValidEmail.value) {
    emailError.value = 'Ingresá un correo válido'
    return
  }

  if (emailList.value.includes(newEmail.value)) {
    emailError.value = 'Este correo ya está en la lista'
    return
  }

  emailList.value.push(newEmail.value)
  newEmail.value = ''
}

const importFromService = async (serviceId: string) => {
  if (isImporting.value) return
  isImporting.value = true
  try {
    const q = query(
      collection(db, 'service_links'),
      where('serviceId', '==', serviceId),
      where('active', '==', true)
    )
    const snap = await getDocs(q)
    const emails = snap.docs.map(d => d.data().email)
    
    // Agregar solo los que no están en la lista
    emails.forEach(email => {
      if (!emailList.value.includes(email)) {
        emailList.value.push(email)
      }
    })

    // Actualizar includeSelf si el propio email se importó
    if (emailList.value.includes(currentUserEmail.value)) {
      includeSelf.value = true
    }
  } catch (err) {
    console.error('Error importando personal:', err)
  } finally {
    isImporting.value = false
  }
}

const removeEmail = (index: number) => {
  const removedEmail = emailList.value[index]
  emailList.value.splice(index, 1)

  // Descheck si se quitó el propio email
  if (removedEmail === currentUserEmail.value) {
    includeSelf.value = false
  }
}

const handleSend = () => {
  emit('send', {
    emails: emailList.value,
    message: message.value,
    serviceId: selectedServiceId.value
  })
}
</script>

<style scoped>
.emails-list-container {
  border: 1px solid #ddd;
  min-height: 100px;
}
</style>
