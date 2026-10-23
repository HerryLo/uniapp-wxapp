import yuque from '../yuque.json'

// #ifdef H5
export const requestHttp = import.meta.env.DEV
  ? '/yuque-api/api/v2'
  : yuque.requestHttp
// #endif
// #ifndef H5
export const requestHttp = yuque.requestHttp
// #endif

export const AuthToken = yuque.AuthToken
export const namespace = yuque.namespace
export const reposLink = yuque.reposLink
