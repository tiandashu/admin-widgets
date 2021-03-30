import Vue from 'vue'
import App from './App.vue'
import QqmapTrack from '../packages/index'
Vue.config.productionTip = false

Vue.use(QqmapTrack)
new Vue({
  render: h => h(App),
}).$mount('#app')
