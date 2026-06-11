<template>
  <div class="auth-container-root">
    <v-container fluid class="pa-8">
      <v-row>
        <v-col cols="12">
          <div class="mb-8">
            <h1 class="text-h3 font-weight-black text-primary mb-2 ls-tight">Control de Usuarios</h1>
            <p class="text-body-2 text-grey-darken-1">Administra roles y permisos de acceso en tiempo real para ALFITA.</p>
          </div>

          <v-card border flat rounded="xl" class="overflow-hidden">
            <v-progress-linear
              v-if="loading"
              indeterminate
              color="primary"
              height="2"
            ></v-progress-linear>

            <v-table hover class="alfita-table">
              <thead class="bg-grey-lighten-4">
                <tr>
                  <th class="text-subtitle-2 font-weight-bold py-4 px-6">Usuario</th>
                  <th class="text-subtitle-2 font-weight-bold py-4 px-6">ID de Usuario</th>
                  <th class="text-subtitle-2 font-weight-bold py-4 px-6 text-center">Rol actual</th>
                  <th class="text-subtitle-2 font-weight-bold py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.uid">
                  <td class="py-4 px-6">
                    <div class="d-flex align-center">
                      <v-avatar color="primary" variant="tonal" size="40" class="mr-4">
                        <v-icon size="20">mdi-account-outline</v-icon>
                      </v-avatar>
                      <div>
                        <div class="text-body-1 font-weight-medium text-grey-darken-4">{{ user.email }}</div>
                        <div class="text-caption text-grey">{{ user.role || 'alfa' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-4 px-6 font-mono text-caption text-grey">
                    {{ user.uid }}
                  </td>
                  <td class="py-4 px-6 text-center">
                    <v-chip
                      :color="getRoleColor(user.role)"
                      variant="flat"
                      size="small"
                      class="font-weight-bold px-4"
                      rounded="pill"
                    >
                      {{ user.role?.toUpperCase() || 'ALFA' }}
                    </v-chip>
                  </td>
                  <td class="py-4 px-6 text-center">
                    <div class="d-flex justify-center align-center">
                      <!-- MENÚ CAMBIAR ROL -->
                      <v-menu transition="scale-transition">
                        <template v-slot:activator="{ props }">
                          <v-btn
                            v-bind="props"
                            icon="mdi-shield-edit-outline"
                            variant="text"
                            color="grey-darken-1"
                            size="small"
                            class="mr-2"
                            title="Cambiar Rol"
                          ></v-btn>
                        </template>
                        <v-list border rounded="lg" density="compact">
                          <v-list-item
                            v-for="roleOption in roles"
                            :key="roleOption"
                            :value="roleOption"
                            @click="updateUserRole(user.uid, roleOption)"
                          >
                            <template v-slot:prepend>
                              <v-icon :color="getRoleColor(roleOption)" size="18">mdi-circle</v-icon>
                            </template>
                            <v-list-item-title class="text-body-2 text-capitalize ml-2">
                              {{ roleOption }}
                            </v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>

                      <!-- BOTÓN ELIMINAR -->
                      <v-btn
                        icon="mdi-trash-can-outline"
                        variant="text"
                        color="error"
                        size="small"
                        @click="confirmDelete(user)"
                        title="Eliminar Usuario"
                      ></v-btn>
                    </div>
                  </td>
                </tr>
                <tr v-if="!loading && users.length === 0">
                  <td colspan="4" class="pa-16 text-center">
                    <v-icon size="48" color="grey-lighten-2" class="mb-4">mdi-account-off-outline</v-icon>
                    <div class="text-body-1 text-grey">No hay usuarios registrados.</div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- DIALOGO CONFIRMACIÓN ELIMINACIÓN -->
    <v-dialog v-model="deleteDialog.show" max-width="400" persistent>
      <v-card rounded="xl" class="pa-4">
        <v-card-title class="text-h6 font-weight-bold">¿Eliminar usuario?</v-card-title>
        <v-card-text class="text-body-2 text-grey-darken-1">
          Esta acción eliminará el registro de <strong>{{ deleteDialog.user?.email }}</strong> de la base de datos de ALFITA. Esta acción no se puede deshacer.
        </v-card-text>
        <v-card-actions class="pt-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey" class="text-none" @click="deleteDialog.show = false">Cancelar</v-btn>
          <v-btn variant="flat" color="error" class="text-none px-6" rounded="pill" @click="deleteUser">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../../plugins/firebase'

interface UserProfile {
  uid: string
  email: string
  role: 'admin' | 'designador' | 'alfa'
}

const users = ref<UserProfile[]>([])
const loading = ref(true)
const roles = ['admin', 'designador', 'alfa'] as const
let unsubscribe: (() => void) | null = null

const snackbar = reactive({ show: false, text: '', color: 'success' })
const deleteDialog = reactive({ show: false, user: null as UserProfile | null })

const getRoleColor = (role: string | undefined) => {
  switch (role) {
    case 'admin': return '#1a73e8'
    case 'designador': return '#1e8e3e'
    case 'alfa': return '#757575'
    default: return '#757575'
  }
}

const showMsg = (text: string, color = 'success') => {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

// Lógica en tiempo real
onMounted(() => {
  const q = query(collection(db, 'users'), orderBy('email', 'asc'))
  unsubscribe = onSnapshot(q, (snapshot) => {
    users.value = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    } as UserProfile))
    loading.value = false
  }, (err) => {
    console.error(err)
    loading.value = false
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

// Acciones de Administración
const updateUserRole = async (uid: string, newRole: string) => {
  try {
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, { role: newRole })
    showMsg(`Rol actualizado correctamente a ${newRole}`)
  } catch (err) {
    showMsg('Error al actualizar rol', 'error')
  }
}

const confirmDelete = (user: UserProfile) => {
  deleteDialog.user = user
  deleteDialog.show = true
}

const deleteUser = async () => {
  if (!deleteDialog.user) return
  try {
    await deleteDoc(doc(db, 'users', deleteDialog.user.uid))
    showMsg('Usuario eliminado del sistema')
    deleteDialog.show = false
  } catch (err) {
    showMsg('Error al eliminar usuario', 'error')
  }
}
</script>

<style scoped>
.auth-container-root {
  min-height: 100vh;
  width: 100%;
  background-color: #f8f9fa !important;
  background-image: radial-gradient(#e0e0e0 1px, transparent 1px) !important;
  background-size: 24px 24px !important;
}

.ls-tight {
  letter-spacing: -2px !important;
}

.alfita-table {
  background: white !important;
}

.font-mono {
  font-family: 'Roboto Mono', monospace !important;
}

.v-table :deep(tr:hover) {
  background-color: #f8f9fa !important;
}

/* Cleanup de bordes Vuetify */
.v-table :deep(.v-table__wrapper > table > thead > tr > th) {
  border-bottom: 1px solid #f1f1f1 !important;
}

.v-table :deep(.v-table__wrapper > table > tbody > tr > td) {
  border-bottom: 1px solid #f8f9fa !important;
}
</style>
