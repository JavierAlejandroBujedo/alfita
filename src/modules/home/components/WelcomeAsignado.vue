<template>
  <div class="py-8">
    <v-card rounded="xl" variant="flat" border class="pa-8 text-center bg-white elevation-1">
      <v-avatar color="green-lighten-5" size="80" class="mb-6">
        <v-icon color="success" size="40">mdi-calendar-check-outline</v-icon>
      </v-avatar>
      <h2 class="text-h4 font-weight-black text-grey-darken-3 mb-4 ls-tight">¡Te damos la bienvenida!</h2>
      <p class="text-body-1 text-grey-darken-1 mx-auto mb-8" style="max-width: 600px">
        Actualmente no tienes solicitudes de disponibilidad pendientes. 
        En cuanto un <strong>Designador</strong> te asigne a un servicio, aparecerá una notificación aquí 
        para que puedas cargar tus horarios del mes.
      </p>
      
      <v-row justify="center" dense>
        <v-col cols="12" sm="6" md="4">
          <v-card variant="tonal" color="primary" rounded="lg" class="pa-4 h-100" to="/mis-turnos">
            <v-icon size="24" class="mb-2">mdi-chevron-right-circle</v-icon>
            <div class="font-weight-bold">Mis Turnos Confirmados</div>
            <div class="text-caption">Revisá los servicios en los que ya estás asignado.</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-card variant="tonal" color="teal" rounded="lg" class="pa-4 h-100">
            <v-icon size="24" class="mb-2">mdi-clock-outline</v-icon>
            <div class="font-weight-bold">Paso Siguiente</div>
            <div class="text-caption">Esperá a que el administrador te solicite disponibilidad.</div>
          </v-card>
        </v-col>
        <v-col v-if="membershipType !== 'ALFA'" cols="12" sm="6" md="4">
          <v-card variant="tonal" color="amber-darken-3" rounded="lg" class="pa-4 h-100" to="/suscripcion">
            <v-icon size="24" class="mb-2">mdi-star-circle</v-icon>
            <div class="font-weight-bold">Pasate a ALFA</div>
            <div class="text-caption">Participá en múltiples servicios sin restricciones.</div>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  membershipType?: string
}>()
</script>

<style scoped>
.ls-tight { letter-spacing: -1px !important; }
</style>
