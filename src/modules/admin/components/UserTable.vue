<template>
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
          <th class="text-subtitle-2 font-weight-bold py-4 px-6">Fecha de Registro</th>
          <th class="text-subtitle-2 font-weight-bold py-4 px-6 text-center">Rol</th>
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
                <div class="text-caption text-grey">{{ getRoleLabel(user.role) }}</div>
              </div>
            </div>
          </td>
          <td class="py-4 px-6 text-caption text-grey">
            {{ formatDate(user.createdAt) }}
          </td>
          <td class="py-4 px-6 text-center">
            <v-chip
              :color="getRoleColor(user.role)"
              variant="flat"
              size="small"
              class="font-weight-bold px-4"
              rounded="pill"
            >
              {{ getRoleLabel(user.role).toUpperCase() }}
            </v-chip>
          </td>
          <td class="py-4 px-6 text-center">
            <div class="d-flex justify-center align-center">
              <!-- Acciones emitidas al padre -->
              <v-btn
                icon="mdi-eye-outline"
                variant="text"
                color="primary"
                size="small"
                class="mr-1"
                title="Ver Detalles"
                @click="$emit('edit', user)"
              ></v-btn>

              <v-menu transition="scale-transition">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-shield-edit-outline"
                    variant="text"
                    color="grey-darken-1"
                    size="small"
                    class="mr-1"
                  ></v-btn>
                </template>
                <v-list border rounded="lg" density="compact">
                  <v-list-item
                    v-for="roleOption in roleOptions"
                    :key="roleOption.value"
                    @click="$emit('updateRole', { uid: user.uid, role: roleOption.value })"
                  >
                    <template v-slot:prepend>
                      <v-icon :color="getRoleColor(roleOption.value)" size="18">mdi-circle</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2 ml-2">
                      {{ roleOption.label }}
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>

              <v-btn
                v-if="user.uid !== currentUserId"
                icon="mdi-trash-can-outline"
                variant="text"
                color="error"
                size="small"
                @click="$emit('delete', user)"
              ></v-btn>
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  users: any[]
  loading: boolean
  currentUserId?: string
}>()

defineEmits(['edit', 'updateRole', 'delete'])

const roleOptions = [
  { label: 'Admin', value: 1 },
  { label: 'Designador', value: 2 },
  { label: 'Alfita', value: 3 }
]

const getRoleLabel = (role: number) => {
  switch (role) {
    case 1: return 'Admin'
    case 2: return 'Designador'
    case 3: return 'Alfita'
    default: return 'Usuario'
  }
}

const getRoleColor = (role: number) => {
  switch (role) {
    case 1: return '#1a73e8'
    case 2: return '#1e8e3e'
    case 3: return '#757575'
    default: return '#757575'
  }
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return '---'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<style scoped>
.alfita-table { background: white !important; }
</style>
