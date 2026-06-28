<template>
  <v-card rounded="xl" border flat class="pa-4 bg-white hover-elevate-soft h-100" @click="$emit('click')">
    <div class="d-flex flex-column flex-sm-row justify-space-between align-start mb-2 ga-2">
      <div class="flex-grow-1">
        <div class="text-overline font-weight-black text-success line-height-1">
          DISPONIBILIDAD SOLICITADA
        </div>
        <h3 class="text-h6 font-weight-black mb-1">
          SVC {{ linked.svcNumber || '---' }} — {{ linked.month }} {{ linked.year }}
        </h3>
        <div v-if="linked.description" class="text-body-2 text-grey">{{ linked.description }}</div>
      </div>
      <v-chip
        :color="hasSubmitted ? 'success' : 'amber-darken-2'"
        size="small"
        variant="flat"
        class="font-weight-bold"
      >
        {{ hasSubmitted ? 'ENVIADO' : 'PENDIENTE' }}
      </v-chip>
    </div>

    <!-- Turnos -->
    <div v-if="hasShifts" class="d-flex flex-wrap ga-2 mt-2 mb-2">
      <v-chip
        v-for="(shift, idx) in activeShifts"
        :key="idx"
        color="primary"
        variant="tonal"
        size="x-small"
        class="font-weight-bold"
      >
        {{ shift.start }} - {{ shift.end }}
      </v-chip>
    </div>

    <v-divider class="my-2"></v-divider>

    <!-- Botón Acción -->
    <v-btn
      v-if="linked.status === 'pending'"
      variant="flat"
      size="small"
      color="indigo-lighten-5"
      class="font-weight-bold text-none text-indigo-darken-3"
      block
    >
      {{ hasSubmitted ? 'Modificar disponibilidad' : 'Cargar disponibilidad' }}
      <v-icon class="ml-1">mdi-arrow-right</v-icon>
    </v-btn>
    <div v-else class="text-center py-2 text-success font-weight-black text-caption">
      <v-icon start size="16">mdi-check-circle-outline</v-icon> Planilla Confirmada
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  linked: any;
  hasSubmitted: boolean;
}>();

defineEmits(['click']);

const activeShifts = computed(() => {
  return (props.linked.shifts || []).filter((s: any) => s && s.start);
});

const hasShifts = computed(() => activeShifts.value.length > 0);
</script>

<style scoped>
.hover-elevate-soft:hover { transform: translateY(-4px); box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important; transition: all 0.3s ease; }
</style>
