<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-2">Suscripción</h1>
    <p class="text-body-1 text-grey-darken-1 mb-8">
      Necesitas una suscripción activa para gestionar tus turnos.
    </p>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="pa-6 border" :class="{ 'border-primary': selectedPlan === 'premium' }">
          <div class="text-overline font-weight-bold text-secondary mb-2">RECOMENDADO</div>
          <h2 class="text-h5 font-weight-bold mb-4">Plan Premium</h2>
          <div class="d-flex align-baseline mb-6">
            <span class="text-h3 font-weight-black">$2.500</span>
            <span class="text-body-2 grey-darken-1 ml-2">/ mensual</span>
          </div>

          <v-list density="compact" class="bg-transparent mb-8">
            <v-list-item prepend-icon="mdi-check" title="Turnos Ilimitados" />
            <v-list-item prepend-icon="mdi-check" title="Notificaciones WhatsApp" />
            <v-list-item prepend-icon="mdi-check" title="Soporte Prioritario" />
          </v-list>

          <v-btn
            block
            color="primary"
            size="large"
            @click="handlePayment"
          >
            Suscribirme Ahora
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const selectedPlan = ref('premium')

const handlePayment = () => {
  console.log('Iniciando flujo de Mercado Pago...')
}
</script>

<style scoped>
.border {
  border: 1px solid #dadce0 !important;
}
.border-primary {
  border: 2px solid #1a73e8 !important;
}
</style>
