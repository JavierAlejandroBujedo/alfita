<template>
  <div class="shift-manager">
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold grey-darken-3">Mis Turnos</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus">
        Nuevo Turno
      </v-btn>
    </div>

    <v-row>
      <v-col v-for="n in 6" :key="n" cols="12" md="4">
        <v-card class="shift-card border pa-4">
          <div class="d-flex justify-space-between align-start mb-4">
            <div>
              <div class="text-overline text-secondary font-weight-bold">
                CONFIRMADO
              </div>
              <h3 class="text-h6 font-weight-bold">Consulta General</h3>
            </div>
            <v-icon color="grey-lighten-1">mdi-dots-vertical</v-icon>
          </div>

          <v-divider class="mb-4" />

          <div class="d-flex align-center mb-2">
            <v-icon size="18" class="mr-2" color="primary">mdi-calendar-range</v-icon>
            <span class="text-body-2 grey-darken-1">12 de Junio, 2026</span>
          </div>

          <div class="d-flex align-center mb-6">
            <v-icon size="18" class="mr-2" color="primary">mdi-clock-outline</v-icon>
            <span class="text-body-2 grey-darken-1">09:00 AM - 10:00 AM</span>
          </div>

          <div class="d-flex gap-2">
            <v-btn variant="tonal" density="comfortable" color="primary">
              Editar
            </v-btn>
            <v-btn variant="text" density="comfortable" color="error">
              Cancelar
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
// Lógica de gestión de turnos irá aquí integrada con Firestore
</script>

<style scoped>
.shift-card {
  border: 1px solid #dadce0 !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.shift-card:hover {
  background-color: #f1f3f4;
  border-color: #1a73e8 !important;
}

.gap-2 {
  gap: 8px;
}
</style>
