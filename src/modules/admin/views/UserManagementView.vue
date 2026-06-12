<template>
  <div class="user-management-view">
    <v-container fluid class="pa-8">
      <v-row>
        <v-col cols="12" class="mx-auto" style="max-width: 1400px">
          <!-- CABECERA CON BÚSQUEDA -->
          <v-row align="end" class="mb-8">
            <v-col cols="12" md="6">
              <h1 class="text-h3 font-weight-black text-primary mb-2 ls-tight">Control de Usuarios</h1>
              <p class="text-body-2 text-grey-darken-1">Registro central de membresías y legajos.</p>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                label="Buscar por nombre o DNI..."
                variant="solo"
                flat
                rounded="pill"
                bg-color="white"
                hide-details
                class="elevation-1"
              />
            </v-col>
          </v-row>

          <UserTable 
            :users="filteredUsers" 
            :loading="loading" 
            :currentUserId="authStore.user?.uid"
            @edit="openDetails"
            @updateRole="handleRoleInit"
            @delete="confirmDelete"
          />
        </v-col>
      </v-row>
    </v-container>

    <UserDetailsModal
      :show="detailsDialog.show"
      :user="detailsDialog.user"
      @close="detailsDialog.show = false"
      @save="saveUserChanges"
    />

    <!-- MODAL DE ACCIÓN EXITOSA -->
    <SuccessModal
      :show="successModal.show"
      :title="successModal.title"
      :message="successModal.message"
      :icon="successModal.icon"
      :color="successModal.color"
      @close="successModal.show = false"
    />

    <!-- DIÁLOGO ELIMINAR -->
    <v-dialog v-model="deleteDialog.show" max-width="400" persistent>
      <v-card rounded="xl" class="pa-6 text-center">
        <v-avatar color="error" variant="tonal" size="64" class="mb-4">
          <v-icon size="32">mdi-alert-octagon</v-icon>
        </v-avatar>
        <h3 class="text-h6 font-weight-bold mb-2">¿Eliminar registro?</h3>
        <p class="text-body-2 text-grey-darken-1 mb-6">Esta acción borrará definitivamente a <strong>{{ deleteDialog.user?.email }}</strong>.</p>
        <v-row dense>
          <v-col cols="6">
            <v-btn block variant="text" rounded="pill" @click="deleteDialog.show = false">Cancelar</v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn block color="error" rounded="pill" elevation="0" @click="deleteUser">Eliminar</v-btn>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../../plugins/firebase'
import { useAuthStore } from '../../auth/stores/authStore'
import UserTable from '../components/UserTable.vue'
import UserDetailsModal from '../components/UserDetailsModal.vue'
import SuccessModal from '../../../components/SuccessModal.vue'

const authStore = useAuthStore()
const users = ref<any[]>([])
const loading = ref(true)
const search = ref('')
let unsubscribe: any = null

const successModal = reactive({ show: false, title: '', message: '', icon: '', color: '' })
const deleteDialog = reactive({ show: false, user: null as any })
const detailsDialog = reactive({ show: false, user: null as any })

// OPTIMIZACIÓN: Caching en memoria local a través de computed
const filteredUsers = computed(() => {
  if (!search.value) return users.value
  const s = search.value.toLowerCase()
  return users.value.filter(u => 
    (u.displayName?.toLowerCase().includes(s)) || 
    (u.dni?.includes(s)) ||
    (u.email?.toLowerCase().includes(s))
  )
})

const showSuccess = (title: string, message: string, icon = 'mdi-check-circle', color = 'primary') => {
  successModal.title = title
  successModal.message = message
  successModal.icon = icon
  successModal.color = color
  successModal.show = true
}

onMounted(() => {
  // onSnapshot es eficiente ya que solo recibe cambios (deltas) después de la carga inicial
  const q = query(collection(db, 'users'), orderBy('email', 'asc'))
  unsubscribe = onSnapshot(q, (snapshot) => {
    users.value = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
    loading.value = false
  }, () => loading.value = false)
})

onUnmounted(() => unsubscribe && unsubscribe())

const handleRoleInit = async (data: any) => {
  try {
    await updateDoc(doc(db, 'users', data.uid), { role: data.role })
    showSuccess('Rol Actualizado', '')
  } catch (err) {
    console.error(err)
  }
}

const openDetails = (user: any) => {
  detailsDialog.user = user
  detailsDialog.show = true
}

const saveUserChanges = async (newData: any) => {
  try {
    const userRef = doc(db, 'users', detailsDialog.user.uid)
    await updateDoc(userRef, { ...newData })
    detailsDialog.show = false
    showSuccess('Cambios Guardados', '')
  } catch (err) {
    console.error(err)
  }
}

const confirmDelete = (user: any) => {
  deleteDialog.user = user
  deleteDialog.show = true
}

const deleteUser = async () => {
  try {
    await deleteDoc(doc(db, 'users', deleteDialog.user.uid))
    deleteDialog.show = false
    showSuccess('Usuario Eliminado', 'El registro ha sido removido satisfactoriamente.', 'mdi-trash-can', 'error')
  } catch (err) {
    console.error(err)
  }
}
</script>

<style scoped>
.user-management-view { min-height: 100vh; background-color: #f8f9fa; }
.ls-tight { letter-spacing: -2px !important; }
</style>
