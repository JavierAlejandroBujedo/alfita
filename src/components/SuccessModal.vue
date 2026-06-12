<template>
  <v-dialog 
    :model-value="show" 
    @update:model-value="$emit('close')"
    max-width="400" 
    persistent
  >
    <v-card rounded="xl" class="pa-6 text-center">
      <v-avatar
        :color="color"
        variant="tonal"
        size="72"
        class="mb-4 mx-auto"
      >
        <v-icon size="40">{{ icon }}</v-icon>
      </v-avatar>
      
      <h3 class="text-h5 font-weight-bold mb-2">{{ title }}</h3>
      <p class="text-body-2 text-grey-darken-1 mb-6">{{ message }}</p>

      <v-btn
        block
        :color="color"
        rounded="pill"
        size="large"
        class="font-weight-bold"
        @click="$emit('close')"
      >
        Entendido
      </v-btn>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  title: string
  message: string
  icon: string
  color: string
}>()

defineEmits(['close'])
</script>
