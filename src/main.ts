import '@vue/repl/style.css';
import './index.less';

import { createApp } from 'vue';
import App from './App.vue';

// @ts-expect-error Custom window property
window.VUE_DEVTOOLS_CONFIG = {
    defaultSelectedAppId: 'repl',
};

createApp(App).mount('#app');
