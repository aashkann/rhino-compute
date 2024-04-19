import './styles/main.css'
import './styles/base.css'
import './styles/neumorphic-light.css'
import 'primevue/resources/themes/aura-light-green/theme.css'
import PrimeVue from 'primevue/config';

import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
app.use(PrimeVue);