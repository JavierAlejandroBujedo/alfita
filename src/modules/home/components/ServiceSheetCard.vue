<template>
  <v-card 
    rounded="xl" 
    border 
    flat 
    :class="[isLinked ? 'pa-3 pb-2' : 'pa-4', 'bg-white hover-elevate-soft h-100']" 
    @click="$emit('view', sheet)"
    style="position: relative;"
  >
    <!-- BOTÓN ELIMINAR (SOLO EN MIS TURNOS / ISLINKED) -->
    <v-btn
      v-if="isLinked"
      icon="mdi-close"
      size="x-small"
      variant="tonal"
      color="error"
      class="delete-btn-top"
      @click.stop="$emit('remove', sheet)"
    ></v-btn>

    <div class="d-flex flex-column flex-lg-row justify-space-between align-start mb-2 ga-2">
      <div class="flex-grow-1">
        <div 
          class="text-overline font-weight-black text-primary line-height-1 mb-1"
          :class="isLinked ? 'text-caption' : ''"
        >
          {{ sheet.month }} {{ sheet.year }}
        </div>
        <h3 :class="isLinked ? 'text-subtitle-2' : 'text-h6'" class="font-weight-black line-height-1">
          <v-icon v-if="isLinked" size="16" color="success" class="mr-1">mdi-shield-check</v-icon>
          Nº SVC {{ sheet.svcNumber || '---' }}
        </h3>
      </div>
      
      <div v-if="!isLinked" class="d-flex flex-wrap align-center ga-2 w-100 w-lg-auto">
        <v-chip :color="statusColor" size="small" variant="flat" class="font-weight-bold px-3">
          {{ statusText }}
        </v-chip>
        
        <v-chip
          v-if="(linkedCount || 0) > 0"
          color="success"
          variant="tonal"
          size="x-small"
          class="font-weight-bold"
          prepend-icon="mdi-account-group"
        >
          {{ linkedCount }}
        </v-chip>

        <v-spacer class="d-none d-sm-block d-lg-none"></v-spacer>

        <div class="d-flex align-center ga-1 ml-auto ml-lg-0">
          <!-- Botones para PENDIENTE -->
          <template v-if="sheet.status === 'pending'">
            <v-btn
              size="x-small"
              color="light-blue-lighten-4"
              variant="flat"
              class="font-weight-bold text-light-blue-darken-4"
              prepend-icon="mdi-check-decagram"
              @click.stop="$emit('confirm', sheet)"
            >CONFIRMAR</v-btn>
            <v-btn icon="mdi-pencil" size="x-small" variant="tonal" color="primary" @click.stop="$emit('edit', sheet)"></v-btn>
            <v-btn icon="mdi-delete" size="x-small" variant="tonal" color="error" @click.stop="$emit('delete', sheet)"></v-btn>
          </template>

          <!-- Botón eliminar para CONFIRMADA -->
          <v-tooltip v-if="sheet.status === 'confirmed'" text="Eliminar planilla confirmada" location="top">
            <template #activator="{ props: tipProps }">
              <v-btn
                v-bind="tipProps"
                icon="mdi-delete-outline"
                size="x-small"
                variant="tonal"
                color="error"
                @click.stop="$emit('delete', sheet)"
              ></v-btn>
            </template>
          </v-tooltip>
        </div>
      </div>
    </div>

    <!-- Info extra para modo normal (no compact/isLinked) -->
    <div v-if="!isLinked" class="text-body-2 text-grey-darken-1 mb-2">{{ sheet.description || 'Sin descripción' }}</div>

    <!-- Turnos / Horarios -->
    <div class="d-flex flex-column flex-sm-row ga-1 mt-1 mb-1">
      <v-btn 
        v-for="idx in [0, 1, 2]" 
        :key="idx"
        @click.stop="!isLinked ? $emit('configureShift', { sheet, idx }) : null"
        variant="flat" 
        :color="isLinked ? 'grey-lighten-4' : 'success'" 
        :size="isLinked ? 'xx-small' : 'x-small'" 
        rounded="pill"
        class="flex-grow-1 font-weight-bold py-1"
        :class="isLinked ? 'text-grey-darken-3' : ''"
        style="min-height: 24px;"
        flat
      >
        <template v-if="sheet.shifts?.[idx]">
          <v-icon start size="12" v-if="isLinked" color="success">mdi-clock-outline</v-icon>
          <span class="text-caption" :style="isLinked ? 'font-size: 0.7rem !important' : ''">
            {{ sheet.shifts[idx].start }} - {{ sheet.shifts[idx].end }}
          </span>
        </template>
        <span v-else-if="!isLinked" class="text-caption">+ HORARIO</span>
        <span v-else class="text-caption">---</span>
      </v-btn>
    </div>
    
    <v-divider class="my-2"></v-divider>
    
    <div class="d-flex align-center justify-space-between">
      <div class="text-caption text-grey" :style="isLinked ? 'font-size: 0.65rem' : ''">
        <v-icon :size="isLinked ? 12 : 14" class="mr-1">mdi-calendar-check</v-icon>
        {{ isLinked ? 'Asignado' : 'Creada el' }} {{ creationDate }}
      </div>
      <v-btn variant="text" :size="isLinked ? 'x-small' : 'small'" color="primary" class="font-weight-bold text-none">
        {{ isLinked ? 'Ver detalles' : 'Ver Planilla' }} <v-icon size="14" class="ml-1">mdi-arrow-right</v-icon>
      </v-btn>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  sheet: any;
  linkedCount?: number;
  isLinked?: boolean;
}>();

defineEmits(['view', 'confirm', 'autocomplete', 'edit', 'delete', 'configureShift', 'remove']);

const statusColor = computed(() => {
  const map: Record<string, string> = {
    'pending': 'amber-darken-2',
    'confirmed': 'success',
    'audited': 'deep-purple'
  };
  return map[props.sheet.status] || 'grey';
});

const statusText = computed(() => {
  const map: Record<string, string> = {
    'pending': 'PENDIENTE',
    'confirmed': 'CONFIRMADO',
    'audited': 'AUDITADO'
  };
  return map[props.sheet.status] || 'ESTADO DESCONOCIDO';
});

const creationDate = computed(() => {
  if (!props.sheet.createdAt) return '---';
  const date = props.sheet.createdAt.toDate ? props.sheet.createdAt.toDate() : new Date(props.sheet.createdAt);
  return date.toLocaleDateString('es-AR');
});
</script>

<style scoped>
.hover-elevate-soft:hover { transform: translateY(-4px); box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important; transition: all 0.3s ease; }
.line-height-1 { line-height: 1.1; }
.delete-btn-top {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}
</style>
