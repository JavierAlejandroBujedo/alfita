<template>
  <v-dialog :model-value="show" max-width="500" persistent transition="dialog-bottom-transition">
    <v-card rounded="xl" class="pa-4">
      <v-card-title class="d-flex align-center px-2">
        <v-icon color="primary" class="mr-3">mdi-email-send-outline</v-icon>
        <span class="text-h6 font-weight-black">Solicitar Disponibilidad</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')"></v-btn>
      </v-card-title>

      <v-card-text class="pa-2">
        <p class="text-body-2 text-grey-darken-1 mb-4">
          Se enviará un aviso a los correos seleccionados para que informen su disponibilidad.
        </p>

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
            @keyup.enter="addEmail"
          />
          <v-btn color="primary" variant="elevated" rounded="lg" @click="addEmail" :disabled="!isValidEmail">
            Añadir
          </v-btn>
        </div>

        <!-- LISTA DE CORREOS -->
        <div class="emails-list-container border-black pa-2 rounded-lg mb-4 bg-grey-lighten-5" style="max-height: 200px; overflow-y: auto;">
          <div v-if="emailList.length === 0" class="text-center py-4 text-grey">
            No hay correos en la lista
          </div>
          <v-chip
            v-for="(email, idx) in emailList"
            :key="idx"
            closable
            color="primary"
            variant="tonal"
            class="ma-1 font-weight-bold"
            @click:close="removeEmail(idx)"
          >
            {{ email }}
          </v-chip>
        </div>

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
          :disabled="emailList.length === 0"
        >
          Enviar Solicitud
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
  show: boolean
  loading?: boolean
}>()

const emit = defineEmits(['close', 'send'])

const newEmail = ref('')
const message = ref('')
const emailList = ref<string[]>([])

// Mock de correos precargados (Esto luego lo traeremos de la base de datos)
const defaultStaffEmails = [
  'oficial.juarez@alfita.com',
  'oficial.gonzalez@alfita.com',
  'sargento.mendoza@alfita.com'
]

const isValidEmail = computed(() => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(newEmail.value)
})

watch(() => props.show, (isVisible) => {
  if (isVisible) {
    // Precargamos los correos si la lista está vacía
    if (emailList.value.length === 0) {
      emailList.value = [...defaultStaffEmails]
    }
    message.value = ''
    newEmail.value = ''
  }
})

const addEmail = () => {
  if (isValidEmail.value && !emailList.value.includes(newEmail.value)) {
    emailList.value.push(newEmail.value)
    newEmail.value = ''
  }
}

const removeEmail = (index: number) => {
  emailList.value.splice(index, 1)
}

const handleSend = () => {
  emit('send', {
    emails: emailList.value,
    message: message.value
  })
}
</script>

<style scoped>
.emails-list-container {
  border: 1px solid #ddd;
  min-height: 100px;
}
</style>
