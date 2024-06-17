import { ref } from 'vue';

const cdnStoreKey = 'cdn-setting';
const cdn = ref(localStorage.getItem(cdnStoreKey) || 'unpkg');

export const cdnTemplates: Record<string, string> = {
    unpkg: 'https://unpkg.com/{pkg}@{version}/{path}',
    jsdelivr: 'https://fastly.jsdelivr.net/npm/{pkg}@{version}/{path}',
    elemecdn: 'https://npm.elemecdn.com/{pkg}@{version}/{path}',
};

export function getCdn() {
    return cdn.value;
}

export function setCdn(name: string) {
    cdn.value = name;
    localStorage.setItem(cdnStoreKey, cdn.value);
}

export function getCdnUrl(pkg: string, path: string, version = 'latest') {
    const template = cdnTemplates[cdn.value];

    return template.replace('{pkg}', pkg).replace('{version}', version).replace('{path}', path);
}

export const getVersions = (pkg: string) => {
    const url = `https://data.jsdelivr.com/v1/package/npm/${pkg}`;
    return fetch(url)
        .then((res) => res.json())
        .then((res) => ((res = res.versions), res));
};
export const getVueVersions = () => {
    return getVersions('vue');
};
export const getTSVersions = () => {
    return getVersions('typescript');
};

export const getCdxComponentVersions = () => {
    return getVersions('cdx-component').then((res) => res.filter((v: string) => v.split('-')[0] >= '0.0.7'));
};
