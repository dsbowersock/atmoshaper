/** Inject compiled CSS and export its scoped class map, without a Next runtime. */
module.exports = function offlineStyleLoader() {}
module.exports.pitch = function injectOfflineStyle(remainingRequest) {
  return `import sheet from ${JSON.stringify("!!" + remainingRequest)};
const style = document.createElement('style');
style.textContent = sheet.toString(); document.head.appendChild(style);
export default sheet.locals || {};`
}
