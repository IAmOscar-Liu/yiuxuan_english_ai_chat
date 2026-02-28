import { LIFF_ID } from "./constants.js";

function init() {
  // Example using window.location.replace()
  return liff
    .init({
      liffId: LIFF_ID, // local
      withLoginOnExternalBrowser: false, // Disable automatic login process
    })
    .then(() => null)
    .catch((e) => e.message);
}

function initWithSearchParams(cb) {
  // Example using window.location.replace()
  return liff
    .init({
      liffId: LIFF_ID, // local
      withLoginOnExternalBrowser: false, // Disable automatic login process
    })
    .then(() => {
      // Get the URL query string
      const queryString = window.location.search;

      // Create a URLSearchParams object
      const urlParams = new URLSearchParams(queryString);

      cb(urlParams);
    })
    .catch((e) => e.message);
}

function isLoggedIn(options) {
  return liff.isLoggedIn(options);
}

function login(options) {
  liff.login(options);
}

async function getProfile() {
  return await liff.getProfile();
}

export { init, initWithSearchParams, isLoggedIn, login, getProfile };
