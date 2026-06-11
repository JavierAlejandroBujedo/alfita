import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { md3 } from 'vuetify/blueprints'

const googleTheme = {
  dark: false,
  colors: {
    primary: '#1a73e8',      // Blue Google
    surface: '#ffffff',
    background: '#f8f9fa',   // Gris Google muy claro
    error: '#d93025',
    secondary: '#1e8e3e',    // Green Google
  },
}

export default createVuetify({
  blueprint: md3,
  components,
  directives,
  theme: {
    defaultTheme: 'googleTheme',
    themes: {
      googleTheme,
    },
  },
  defaults: {
    VCard: {
      rounded: 'xl', // md3 xl corresponds to roughly 28px in most contexts
      elevation: 0,
      variant: 'flat',
    },
    VBtn: {
      rounded: 'pill', // Botones tipo cápsula de Google
      elevation: 0,
      class: 'text-none font-weight-bold', // Google usa títulos sin mayúsculas forzadas
    },
    VTextField: {
      rounded: 'lg',
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
    VNavigationDrawer: {
      rounded: 'e-xl',
    }
  },
})
