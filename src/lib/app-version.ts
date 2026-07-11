export function getAppVersion(): string {
  return import.meta.env.VITE_APP_VERSION ?? 'dev'
}

export function getAppBuildTime(): string | undefined {
  const value = import.meta.env.VITE_BUILD_TIME
  return value || undefined
}
