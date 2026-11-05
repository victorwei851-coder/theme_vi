import 'virtual:svg-icons-register'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { themeKey } from './utils/themeKey'
import SvgIcon from './components/svgIcon.vue'
import './styles/theme.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(themeKey)
app.component('SvgIcon', SvgIcon)
app.mount('#app')
