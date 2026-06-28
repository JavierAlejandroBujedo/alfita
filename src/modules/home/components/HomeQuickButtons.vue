<template>
  <div class="d-flex flex-column flex-md-row align-start align-md-center ga-3">
    <!-- BOTÓN: VER DISPONIBILIDAD -->
    <v-btn
      v-if="isDesignadorOrAdmin"
      color="teal-lighten-4"
      variant="flat"
      prepend-icon="mdi-account-clock"
      rounded="pill"
      class="font-weight-bold px-6 text-teal-darken-4"
      @click="$emit('staffAvailability')"
    >
      Ver disponibilidad del personal
    </v-btn>

    <!-- BOTÓN: SOLICITAR DISPONIBILIDAD -->
    <v-btn
      v-if="isDesignadorOrAdmin"
      color="deep-orange-lighten-4"
      variant="flat"
      prepend-icon="mdi-email-plus-outline"
      rounded="pill"
      class="font-weight-bold px-6 text-deep-orange-darken-4"
      @click="$emit('requestAvailability')"
    >
      Solicitar Disponibilidad
    </v-btn>

    <!-- BOTÓN: CREAR HOJA DE SERVICIO -->
    <v-btn
      v-if="isDesignadorOrAdmin"
      color="primary"
      prepend-icon="mdi-file-plus"
      rounded="pill"
      class="px-8 font-weight-bold elevation-4 shadow-primary"
      @click="$emit('createSheet')"
    >
      Crear Hoja de Servicio
    </v-btn>

    <!-- BOTÓN: ENVIAR DISPONIBILIDAD -->
    <v-btn
      v-if="hasPending"
      color="success"
      prepend-icon="mdi-calendar-check"
      rounded="pill"
      class="px-8 font-weight-bold elevation-4 shadow-success"
      @click="$emit('submitAvailability')"
    >
      Enviar Disponibilidad
    </v-btn>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isDesignadorOrAdmin: boolean;
  hasPending: boolean;
}>();

defineEmits(['staffAvailability', 'requestAvailability', 'createSheet', 'submitAvailability']);
</script>

<style scoped>
.shadow-primary { box-shadow: 0 4px 15px rgba(25, 118, 210, 0.4) !important; }
.shadow-success { box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4) !important; }
</style>
