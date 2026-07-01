<template>
  <v-btn
    prepend-icon="mdi-file-download-outline"
    variant="elevated"
    color="teal-lighten-1"
    class="mr-2 font-weight-bold"
    :loading="downloading"
    @click="download"
  >
    Descargar
  </v-btn>

  <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="pill" location="top" timeout="4000">
    {{ snackbarText }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// ─── Props ───────────────────────────────────────────────────────────────────
const props = defineProps<{
  svcNumber: string | number
  month: string
  year: string | number
  frontId?: string
  backId?: string
}>()

// ─── State ───────────────────────────────────────────────────────────────────
const downloading   = ref(false)
const snackbar      = ref(false)
const snackbarText  = ref('')
const snackbarColor = ref<'success' | 'error' | 'warning'>('success')

const FRONT_ID = computed(() => props.frontId ?? 'front-sheet')
const BACK_ID  = computed(() => props.backId  ?? 'back-sheet')

function notify(text: string, color: 'success' | 'error' | 'warning') {
  snackbarText.value  = text
  snackbarColor.value = color
  snackbar.value      = true
}

// ─── DOM helpers ─────────────────────────────────────────────────────────────

/** Save and override inline styles, return a restore function */
function forceVisible(el: HTMLElement): () => void {
  const savedDisplay     = el.style.display
  const savedVisibility  = el.style.visibility
  const savedPosition    = el.style.position
  const savedWidth       = el.style.width
  const savedMaxWidth    = el.style.maxWidth

  // Position off-screen and constrain to A4 portrait width
  el.style.position   = 'fixed'
  el.style.top        = '-99999px'
  el.style.left       = '-99999px'
  el.style.display    = 'block'
  el.style.visibility = 'visible'
  el.style.width      = '800px'
  el.style.maxWidth   = '800px'

  return () => {
    el.style.display    = savedDisplay
    el.style.visibility = savedVisibility
    el.style.position   = savedPosition
    el.style.width      = savedWidth
    el.style.maxWidth   = savedMaxWidth
    el.style.top        = ''
    el.style.left       = ''
  }
}

/** Capture the .print-container inside a card element as a canvas */
async function captureCard(card: HTMLElement): Promise<HTMLCanvasElement> {
  const target = card.querySelector<HTMLElement>('.print-container') ?? card
  return html2canvas(target, {
    scale: 2.5,  // high resolution for clean printing
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: 1200 // evaluates media queries as desktop standard
  })
}

/**
 * Add a canvas as a full A4 portrait page to the PDF.
 * The image is always scaled to fill the A4 area maintaining its aspect ratio.
 * Never switches to landscape — always portrait, always one page per canvas.
 */
function addCanvasAsA4Page(pdf: jsPDF, canvas: HTMLCanvasElement, isFirst: boolean): void {
  const PAGE_W = 210   // A4 portrait mm
  const PAGE_H = 297   // A4 portrait mm
  const MARGIN_W = 6    // thin margins for maximum coverage
  const MARGIN_H = 8    // thin margins for maximum coverage

  const availW = PAGE_W - MARGIN_W * 2   // 198mm
  const availH = PAGE_H - MARGIN_H * 2   // 281mm

  // Scale to fit within available area, maintaining aspect ratio
  const canvasRatio = canvas.height / canvas.width
  let imgW = availW
  let imgH = imgW * canvasRatio

  if (imgH > availH) {
    imgH = availH
    imgW = imgH / canvasRatio
  }

  // Center horizontally
  const x = MARGIN_W + (availW - imgW) / 2
  const y = MARGIN_H

  if (!isFirst) {
    pdf.addPage('a4', 'p')
  }

  pdf.addImage(
    canvas.toDataURL('image/jpeg', 0.95),
    'JPEG',
    x, y,
    imgW, imgH
  )
}

// ─── Main download action ─────────────────────────────────────────────────────
async function download() {
  const frontCard = document.getElementById(FRONT_ID.value)
  const backCard  = document.getElementById(BACK_ID.value)

  if (!frontCard || !backCard) {
    notify('No se pudieron encontrar los elementos de la planilla.', 'error')
    return
  }

  downloading.value = true

  let restoreFront: (() => void) | null = null
  let restoreBack:  (() => void) | null = null

  try {
    // ─ Step 1: capture front page ──────────────────────────────────────────
    // Show front off-screen, hide back completely so they don't overlap
    restoreFront = forceVisible(frontCard)
    backCard.style.display = 'none'

    await new Promise(resolve => setTimeout(resolve, 250))
    const canvasFront = await captureCard(frontCard)

    // Restore front, then expose back
    restoreFront()
    restoreFront = null

    // ─ Step 2: capture back page ───────────────────────────────────────────
    restoreBack = forceVisible(backCard)

    await new Promise(resolve => setTimeout(resolve, 250))
    const canvasBack = await captureCard(backCard)

    restoreBack()
    restoreBack = null

    // ─ Step 3: build 2-page portrait PDF ──────────────────────────────────
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })

    addCanvasAsA4Page(pdf, canvasFront, true)   // Page 1 – Planilla
    addCanvasAsA4Page(pdf, canvasBack,  false)  // Page 2 – Resumen

    const filename = `completo_svc${props.svcNumber || ''}_${props.month || ''}_${props.year || ''}.pdf`
    pdf.save(filename)

    notify('¡PDF completo descargado correctamente!', 'success')
  } catch (err) {
    restoreFront?.()
    restoreBack?.()
    console.error('[DownloadSheetBtn] Error:', err)
    notify('Error al generar el PDF. Intentá de nuevo.', 'error')
  } finally {
    downloading.value = false
  }
}
</script>
