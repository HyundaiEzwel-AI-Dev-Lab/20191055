import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/app/router'

import '@/shared/styles/fonts.css'
import '@/shared/styles/tokens.css'
import '@/shared/styles/base.css'
import '@/shared/styles/components.css'
import '@/shared/styles/layout.css'
import '@/shared/styles/admin.css'
import '@/shared/styles/search-filter.css'
import '@/shared/styles/dash-analysis-card.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
