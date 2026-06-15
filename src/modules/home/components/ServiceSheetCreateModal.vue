<template>
  <v-dialog :model-value="show" :width="1000" persistent transition="dialog-bottom-transition">
    <v-card rounded="xl" class="pa-2 overflow-hidden bg-grey-lighten-5">
      <v-card-title class="d-flex align-center px-6 pt-4 pb-0">
        <v-avatar color="primary" variant="tonal" size="40" class="mr-3">
          <v-icon size="20">mdi-file-plus</v-icon>
        </v-avatar>
        <span class="text-h6 font-weight-black">Nueva Hoja de Servicio</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')"></v-btn>
      </v-card-title>

      <v-card-text class="pa-2 overflow-y-auto" style="max-height: 65vh;">
        <v-form ref="formRef" v-model="formValid">
          <v-row density="compact">
            
            <!-- SECCIÓN 1: DATOS DE COBERTURA -->
            <v-col cols="12">
              <v-card variant="outlined" border rounded="lg" class="pa-2 bg-white">
                <div class="text-overline font-weight-black text-primary mb-1">COBERTURA Y REFERENCIA</div>
                <v-row density="compact">
                  <v-col cols="12" md="4">
                    <v-select
                      v-model="form.month"
                      :items="months"
                      label="Mes"
                      variant="solo-filled"
                      flat
                      rounded="lg"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-select
                      v-model="form.year"
                      :items="availableYears"
                      label="Año"
                      variant="solo-filled"
                      flat
                      rounded="lg"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-text-field
                      v-model="form.svcNumber"
                      label="Nº de SVC"
                      variant="solo-filled"
                      flat
                      rounded="lg"
                      density="compact"
                      placeholder="Ej. 000086"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="form.description"
                      label="Breve descripción (Opcional)"
                      variant="solo-filled"
                      flat
                      rounded="lg"
                      density="compact"
                      placeholder="Ej. Taller de Locomotoras..."
                      hide-details
                    />
                  </v-col>
                </v-row>
              </v-card>
            </v-col>

            <!-- SECCIÓN 2: DATOS DE LA ENTIDAD -->
            <v-col cols="12" md="6">
              <v-card variant="outlined" border rounded="lg" class="pa-2 bg-white h-100">
                <div class="text-overline font-weight-black text-secondary mb-1">DATOS DE LA ENTIDAD</div>
                <v-text-field v-model="form.entidad" label="Entidad" variant="solo-filled" flat rounded="lg" density="compact" hide-details class="mb-1" />
                <v-row density="compact" class="mb-1">
                  <v-col cols="9">
                    <v-text-field v-model="form.domicilio" label="Domicilio (Calle)" variant="solo-filled" flat rounded="lg" density="compact" hide-details />
                  </v-col>
                  <v-col cols="3">
                    <v-text-field v-model="form.nroDomicilio" label="Nº" variant="solo-filled" flat rounded="lg" density="compact" hide-details />
                  </v-col>
                </v-row>
                <v-text-field v-model="form.telefonoEntidad" label="Teléfono Entidad" variant="solo-filled" flat rounded="lg" density="compact" hide-details class="mb-1" />
                <v-text-field v-model="form.referente" label="Referente de la entidad" variant="solo-filled" flat rounded="lg" density="compact" hide-details class="mb-1" />
                <v-text-field v-model="form.telefonoReferente" label="Teléfono Referente" variant="solo-filled" flat rounded="lg" density="compact" hide-details class="mb-1" />
                <v-row density="compact">
                  <v-col cols="12" md="6"><v-text-field v-model="form.barrio" label="Barrio" variant="solo-filled" flat rounded="lg" density="compact" hide-details /></v-col>
                  <v-col cols="12" md="6"><v-text-field v-model="form.comisaria" label="Comisaría" variant="solo-filled" flat rounded="lg" density="compact" hide-details /></v-col>
                </v-row>
              </v-card>
            </v-col>

            <!-- SECCIÓN 3: PERSONAL ENCARGADO -->
            <v-col cols="12" md="6">
              <v-card variant="outlined" border rounded="lg" class="pa-2 bg-white h-100">
                <div class="text-overline font-weight-black text-amber-darken-3 mb-1">PERSONAL ENCARGADO</div>
                
                <v-text-field 
                  v-model="form.jerarquia" 
                  label="Jerarquía" 
                  variant="solo-filled" 
                  flat rounded="lg" 
                  density="compact" 
                  hide-details
                  class="mb-1"
                  disabled
                  bg-color="grey-lighten-4"
                />

                <v-text-field 
                  v-model="form.policiaEncargado" 
                  label="Nombre y apellido" 
                  variant="solo-filled" 
                  flat rounded="lg" 
                  density="compact" 
                  hide-details
                  class="mb-1"
                  disabled
                  bg-color="grey-lighten-4"
                />

                <v-row density="compact">
                  <v-col cols="6">
                    <v-text-field v-model="form.dni" label="D.N.I." variant="solo-filled" flat rounded="lg" density="compact" hide-details disabled bg-color="grey-lighten-4" />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field v-model="form.telefonoPersona" label="Teléfono" variant="solo-filled" flat rounded="lg" density="compact" hide-details disabled bg-color="grey-lighten-4" />
                  </v-col>
                </v-row>

                <v-text-field 
                  v-model="form.email" 
                  label="E-mail" 
                  variant="solo-filled" 
                  flat rounded="lg" 
                  density="compact" 
                  hide-details
                  class="mb-1"
                  disabled
                  bg-color="grey-lighten-4"
                />

                <v-text-field 
                  v-model="form.lugarRevista" 
                  label="Lugar de revista" 
                  variant="solo-filled" 
                  flat rounded="lg" 
                  density="compact" 
                  hide-details
                  placeholder="Escribir aquí..."
                />
              </v-card>
            </v-col>

          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4 bg-white border-t">
        <v-spacer />
        <v-btn variant="text" color="grey" @click="$emit('close')">Cancelar</v-btn>
        <v-btn
          color="primary"
          rounded="pill"
          size="large"
          class="px-10 font-weight-bold"
          :loading="saving"
          :disabled="!isFormIncomplete"
          @click="handleSave"
        >
          Generar Servicio
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useAuthStore } from '../../../modules/auth/stores/authStore'

const props = defineProps<{
  show: boolean
  saving: boolean
  editData?: any // Nueva propiedad para edición
}>()

const emit = defineEmits(['close', 'save'])
const authStore = useAuthStore()

const months = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
]

const formValid = ref(false)
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return [currentYear, currentYear + 1]
})

const form = reactive({
  month: months[new Date().getMonth()],
  year: new Date().getFullYear(),
  svcNumber: '',
  description: '',
  entidad: '',
  domicilio: '',
  nroDomicilio: '',
  telefonoEntidad: '',
  referente: '',
  telefonoReferente: '',
  barrio: '',
  comisaria: '',
  distrito: '',
  jerarquia: '',
  policiaEncargado: '',
  dni: '',
  telefonoPersona: '',
  email: '',
  lugarRevista: '',
  assignments: {}
})

const isFormIncomplete = computed(() => {
  return form.entidad.trim() !== '' && form.month !== ''
})

// Llenar datos (Nuevo o Edición)
watch(() => props.show, (isVisible) => {
  if (isVisible) {
    if (props.editData) {
      // MODO EDICIÓN: Copiar datos existentes
      Object.assign(form, props.editData)
    } else if (authStore.userData) {
      // MODO CREACIÓN: Datos por defecto del perfil
      form.month = months[new Date().getMonth()]
      form.year = new Date().getFullYear()
      form.svcNumber = ''
      form.description = ''
      form.entidad = ''
      form.domicilio = ''
      form.nroDomicilio = ''
      form.telefonoEntidad = ''
      form.referente = ''
      form.telefonoReferente = ''
      form.barrio = ''
      form.comisaria = ''
      form.distrito = ''
      form.jerarquia = authStore.userData.hierarchy || ''
      form.policiaEncargado = authStore.userData.displayName || ''
      form.dni = authStore.userData.dni || ''
      form.telefonoPersona = authStore.userData.phone || ''
      form.email = authStore.userData.email || ''
      form.lugarRevista = ''
      form.assignments = {}
    }
  }
})

// Reset assignments if month/year changes during edit
watch([() => form.month, () => form.year], ([newMonth, newYear]) => {
  if (props.show && props.editData) {
    if (newMonth !== props.editData.month || newYear !== props.editData.year) {
      form.assignments = {}
    } else {
      // Restore if changed back
      form.assignments = props.editData.assignments || {}
    }
  }
})

const handleSave = () => {
  emit('save', { ...form })
}
</script>
