export function VersionInfo() {
  return (
    <div className="text-xs text-gray-400 text-center py-4">
      <p>
        v{__APP_VERSION__} (build {__BUILD_NUMBER__})
      </p>
      <p className="text-gray-300">
        {__COMMIT_HASH__}
      </p>
    </div>
  )
}
