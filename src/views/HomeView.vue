<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <v-img
          :src="logo"
          class="my-3"
          contain
          height="100"
        />
      </v-col>

      <v-col class="mb-4">
        <h1 class="display-2 font-weight-bold mb-3">
          Bienvenido a DESIGNADOR
        </h1>
        <p class="subheading font-weight-regular">
          Gestión de turnos inteligente con suscripciones seguras.
        </p>
      </v-col>

      <v-col class="mb-5" cols="12">
        <v-btn color="primary" large @click="start">
          Empezar Ahora
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const logo = 'https://cdn.vuetifyjs.com/images/logos/vuetify-logo-light.png'

const start = () => {
  console.log('Iniciando sistema de turnos...')
}
</script>
