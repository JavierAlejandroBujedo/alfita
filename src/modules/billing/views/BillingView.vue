<template>
  <div class="billing-view pa-4 pa-md-8">
    <!-- Selector Superior Estilo Pastilla -->
    <div class="d-flex justify-center mb-10 mt-4">
      <div class="selector-container bg-grey-lighten-4 pa-1 rounded-pill d-flex">
        <v-btn
          @click="activeCategory = 'Designador'"
          :variant="activeCategory === 'Designador' ? 'flat' : 'text'"
          :color="activeCategory === 'Designador' ? 'primary' : 'grey-darken-1'"
          rounded="pill"
          class="px-8 font-weight-bold"
          size="large"
        >
          Designador
        </v-btn>
        <v-btn
          @click="activeCategory = 'Asignado'"
          :variant="activeCategory === 'Asignado' ? 'flat' : 'text'"
          :color="activeCategory === 'Asignado' ? 'primary' : 'grey-darken-1'"
          rounded="pill"
          class="px-8 font-weight-bold"
          size="large"
        >
          Asignado
        </v-btn>
      </div>
    </div>

    <!-- Grid de Planes -->
    <v-row justify="center" align="stretch">
      <v-progress-circular v-if="loading" indeterminate color="primary" class="my-10" />
      
      <v-col
        v-for="plan in filteredPlans"
        :key="plan.id"
        cols="12"
        sm="6"
        lg="3"
        class="d-flex"
      >
        <v-card
          rounded="xl"
          border
          flat
          class="subscription-card flex-grow-1 d-flex flex-column pa-6"
          :class="{ 'highlight-card': plan.isDynamic }"
        >
          <!-- Header del Plan -->
          <div class="d-flex justify-space-between align-start mb-2">
            <h3 class="text-h6 font-weight-black text-primary">{{ plan.title }}</h3>
            <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
              {{ plan.period }}
            </v-chip>
          </div>

          <div class="text-caption text-grey-darken-1 mb-4">
            {{ plan.isDynamic ? `Para ${planQuantities[plan.id] || 1} usuario(s)` : 'Plan estándar' }}
          </div>

          <!-- Precio -->
          <div class="d-flex align-center mb-1">
            <span class="text-h4 font-weight-black text-black">
              ${{ formatPrice(calculatePrice(plan)) }}
            </span>
            <span class="text-caption text-grey ml-1 mt-2">/{{ plan.period === 'Mensual' ? 'mes' : 'año' }}</span>
          </div>
          <div class="text-caption text-grey-darken-1 mb-6">Cobro recurrente</div>

          <!-- Lista de Beneficios -->
          <v-list density="compact" class="bg-transparent flex-grow-1 mb-6 pa-0">
            <v-list-item
              v-for="(item, idx) in plan.items"
              :key="idx"
              class="pa-0 min-h-0 mb-2"
              density="compact"
            >
              <template v-slot:prepend>
                <v-icon color="success" size="18" class="mr-2">mdi-check-circle-outline</v-icon>
              </template>
              <v-list-item-title class="text-caption text-grey-darken-3 text-wrap">{{ item }}</v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- Selector de Cantidad (Solo si es dinámico) -->
          <div v-if="plan.isDynamic" class="quantity-selector bg-grey-lighten-4 pa-2 rounded-lg d-flex align-center justify-space-between mb-4">
            <div class="text-caption font-weight-bold ml-2">Cantidad</div>
            <div class="d-flex align-center">
              <v-btn
                icon="mdi-minus"
                size="x-small"
                variant="flat"
                color="white"
                rounded="sm"
                @click="updateQuantity(plan.id, -1)"
              />
              <span class="mx-3 font-weight-black text-body-2">{{ planQuantities[plan.id] || 1 }}</span>
              <v-btn
                icon="mdi-plus"
                size="x-small"
                variant="flat"
                color="white"
                rounded="sm"
                @click="updateQuantity(plan.id, 1)"
              />
            </div>
          </div>

          <!-- Botón de Acción -->
          <v-btn
            v-if="plan.showButton !== false"
            block
            color="primary"
            rounded="pill"
            size="large"
            class="font-weight-bold text-none mt-auto"
            variant="flat"
          >
            {{ plan.buttonLabel || 'Suscribirse' }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Estado vacío -->
    <div v-if="!loading && filteredPlans.length === 0" class="text-center py-10">
      <v-icon size="64" color="grey-lighten-2">mdi-star-off-outline</v-icon>
      <div class="text-h6 text-grey mt-4">No hay planes disponibles para {{ activeCategory }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../../plugins/firebase'

const loading = ref(true)
const activeCategory = ref('Designador')
const plans = ref<any[]>([])
const planQuantities = reactive<Record<string, number>>({})

onMounted(() => {
  const q = query(collection(db, 'subscriptions'), where('visible', '==', true))
  onSnapshot(q, (snap) => {
    // Traemos los datos y los ordenamos cronológicamente en cliente
    const rawPlans = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    
    plans.value = rawPlans.sort((a: any, b: any) => {
      const dateA = a.updatedAt?.seconds || 0
      const dateB = b.updatedAt?.seconds || 0
      return dateA - dateB // Menor a mayor (izquierda a derecha)
    })

    plans.value.forEach(p => {
      if (!planQuantities[p.id]) planQuantities[p.id] = 1
    })
    loading.value = false
  })
})

const filteredPlans = computed(() => {
  return plans.value.filter(p => p.category === activeCategory.value)
})

const updateQuantity = (planId: string, delta: number) => {
  const current = planQuantities[planId] || 1
  const newVal = Math.max(1, current + delta)
  planQuantities[planId] = newVal
}

const calculatePrice = (plan: any) => {
  if (!plan.isDynamic) return plan.price
  const qty = planQuantities[plan.id] || 1
  return plan.price * qty
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-AR').format(price)
}

import { reactive } from 'vue'
</script>

<style scoped>
.billing-view { min-height: 100vh; background-color: #ffffff; }
.selector-container { border: 1px solid #e0e0e0; }
.subscription-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #eef0f2;
  background: white;
}
.subscription-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.05) !important;
  border-color: rgba(var(--v-theme-primary), 0.3);
}
.highlight-card {
  border: 2px solid rgba(var(--v-theme-primary), 0.1);
  position: relative;
}
.highlight-card::after {
  content: 'MÁS POPULAR';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgb(var(--v-theme-primary));
  color: white;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 1px;
}
.min-h-0 { min-height: 0 !important; }
.text-wrap { white-space: normal !important; }
</style>
