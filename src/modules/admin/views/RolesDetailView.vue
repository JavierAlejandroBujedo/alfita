<template>
  <div class="roles-detail-view pa-4 pa-md-8">
    <div class="max-width-container mx-auto">
      <div class="d-flex align-center mb-8">
        <v-btn icon="mdi-arrow-left" variant="text" class="mr-4" @click="$router.back()"></v-btn>
        <div>
          <h1 class="text-h4 font-weight-black text-black ls-tight">Detalles del Sistema</h1>
          <p class="text-subtitle-2 text-grey">Gestioná las definiciones y privilegios de cada rol</p>
        </div>
      </div>

      <v-row v-if="!loading">
        <v-col v-for="role in roles" :key="role.id" cols="12" md="6" lg="3">
          <v-card rounded="xl" border flat class="role-card h-100 pa-6 d-flex flex-column group">
            <div class="d-flex justify-space-between align-center mb-4">
              <v-avatar :color="role.color" variant="tonal" size="48">
                <v-icon :color="role.color">{{ role.icon }}</v-icon>
              </v-avatar>
              <v-btn icon="mdi-pencil" variant="tonal" size="x-small" color="primary" class="opacity-0 group-hover-opacity-100 transition-all" @click="openEdit(role)"></v-btn>
            </div>

            <h2 class="text-h6 font-weight-black mb-1" :style="{ color: getStrongColor(role.color) }">{{ role.name }}</h2>
            <p class="text-caption text-grey-darken-1 mb-4 flex-grow-1">{{ role.description }}</p>

            <v-divider class="mb-4"></v-divider>

            <div class="text-caption font-weight-bold mb-2 text-grey-darken-3">Privilegios:</div>
            <v-list density="compact" class="bg-transparent pa-0">
              <v-list-item v-for="(privilege, idx) in role.privileges" :key="idx" class="pa-0 min-h-0 mb-1" density="compact">
                <template v-slot:prepend>
                  <v-icon color="success" size="14" class="mr-2">mdi-check-circle</v-icon>
                </template>
                <v-list-item-title class="text-caption text-grey-darken-3">{{ privilege }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
      
      <v-skeleton-loader v-else type="card, card, card, card" class="bg-transparent" />

      <!-- Dialogo de Edición -->
      <v-dialog v-model="editDialog.show" max-width="600" persistent>
        <v-card rounded="xl" class="pa-6">
          <v-card-title class="text-h6 font-weight-bold mb-4">Editar Rol: {{ editDialog.data.name }}</v-card-title>
          <v-card-text>
            <v-text-field v-model="editDialog.data.name" label="Nombre del Rol" variant="outlined" rounded="lg" class="mb-4" />
            <v-textarea v-model="editDialog.data.description" label="Descripción" variant="outlined" rounded="lg" rows="3" class="mb-4" />
            
            <div class="text-caption font-weight-bold mb-2">Privilegios (uno por línea)</div>
            <v-textarea v-model="editDialog.data.privilegesText" variant="outlined" rounded="lg" rows="5" />
          </v-card-text>
          <v-card-actions class="pt-4">
            <v-spacer />
            <v-btn variant="text" @click="editDialog.show = false">Cancelar</v-btn>
            <v-btn color="primary" rounded="pill" class="px-8 font-weight-bold" @click="saveRole" :loading="saving">Guardar Cambios</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
    
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { collection, onSnapshot, doc, setDoc, query, orderBy } from 'firebase/firestore'
import { db } from '../../../plugins/firebase'

const loading = ref(true)
const saving = ref(false)
const roles = ref<any[]>([])
const snackbar = reactive({ show: false, text: '', color: 'success' })

const editDialog = reactive({
  show: false,
  data: { id: 0, name: '', description: '', privileges: [] as string[], privilegesText: '', color: '', icon: '' }
})

const defaultRoles = [
  { id: 1, name: 'Admin', icon: 'mdi-shield-crown', color: 'deep-purple', description: 'Acceso total.', privileges: ['Gestión global'] },
  { id: 2, name: 'Alfita', icon: 'mdi-account-outline', color: 'blue', description: 'Rol gratuito.', privileges: ['Acceso básico'] },
  { id: 3, name: 'Designador', icon: 'mdi-account-star', color: 'amber', description: 'Plan Designador.', privileges: ['Funciones Designador'] },
  { id: 4, name: 'Asignado', icon: 'mdi-account-tie', color: 'green', description: 'Plan Asignado.', privileges: ['Funciones Asignado'] }
]

const getStrongColor = (color: string) => {
  if (!color) return '#000'
  // Si el color ya tiene un modificador, lo limpiamos para el texto
  const base = color.split('-')[0]
  switch (base) {
    case 'deep-purple': return '#5E35B1'
    case 'blue': return '#1976D2'
    case 'amber': return '#FF8F00'
    case 'green': return '#2E7D32'
    default: return '#333'
  }
}

onMounted(() => {
  // Escuchar cambios en la meta-información de roles
  const q = query(collection(db, 'roles_info'), orderBy('id', 'asc'))
  onSnapshot(q, (snap) => {
    if (snap.empty) {
      // Si la colección está vacía, la inicializamos con los valores por defecto
      initRoles()
    } else {
      roles.value = snap.docs.map(d => ({ docId: d.id, ...d.data() }))
      loading.value = false
    }
  })
})

const initRoles = async () => {
  for (const r of defaultRoles) {
    await setDoc(doc(db, 'roles_info', `role_${r.id}`), r)
  }
}

const openEdit = (role: any) => {
  editDialog.data = {
    ...role,
    privilegesText: (role.privileges || []).join('\n')
  }
  editDialog.show = true
}

const saveRole = async () => {
  saving.value = true
  try {
    const privileges = editDialog.data.privilegesText.split('\n').filter(l => l.trim() !== '')
    await setDoc(doc(db, 'roles_info', `role_${editDialog.data.id}`), {
      id: editDialog.data.id,
      name: editDialog.data.name,
      description: editDialog.data.description,
      color: editDialog.data.color,
      icon: editDialog.data.icon,
      privileges: privileges,
      updatedAt: new Date()
    })
    snackbar.text = 'Rol actualizado correctamente'
    snackbar.color = 'success'
    snackbar.show = true
    editDialog.show = false
  } catch (e) {
    snackbar.text = 'Error al actualizar'
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.roles-detail-view { min-height: 100vh; background-color: #f8f9fa; }
.max-width-container { max-width: 1200px; }
.ls-tight { letter-spacing: -2px !important; }
.role-card { transition: all 0.3s ease; background: white; border: 1px solid #eef0f2; cursor: default; }
.role-card:hover { border-color: rgba(var(--v-theme-primary), 0.3); }
.group:hover .group-hover-opacity-100 { opacity: 1 !important; }
.opacity-0 { opacity: 0; }
.transition-all { transition: all 0.3s ease; }
.min-h-0 { min-height: 0 !important; }
</style>
