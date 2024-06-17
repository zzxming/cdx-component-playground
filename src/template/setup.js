import { getCurrentInstance } from 'vue';
import CdxComponent from 'cdx-component';

let installed = false;

export const setupCdxComponent = () => {
    if (installed) return;
    const instance = getCurrentInstance();
    instance.appContext.app.use(CdxComponent);
    installed = true;
};

export const loadStyle = () => {
    const styles = ['$STYLE'].map((style) => {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = style;
            link.addEventListener('load', resolve);
            link.addEventListener('error', reject);
            document.body.append(link);
        });
    });
    return Promise.all(styles);
};

await loadStyle();
