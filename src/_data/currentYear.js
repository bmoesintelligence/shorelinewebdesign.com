// Current year for the footer copyright, evaluated at build time. Netlify builds
// fresh on every deploy, so this stays current as long as the site is redeployed
// at least once a year.
module.exports = () => new Date().getFullYear();
