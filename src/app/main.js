import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/app/router'

import '@/shared/styles/tokens.css'
import '@/shared/styles/base.css'
import '@/shared/styles/components.css'
import '@/shared/styles/layout.css'
import '@/shared/styles/admin.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
