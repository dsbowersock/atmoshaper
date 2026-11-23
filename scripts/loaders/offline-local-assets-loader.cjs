/** Rebind only existing fixed globe images for the native bundle. */
module.exports = function offlineLocalAssets(source) {
  return source.replaceAll("https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg", "./textures/earth-blue-marble.jpg")
    .replaceAll("https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png", "./textures/earth-topology.png")
}
