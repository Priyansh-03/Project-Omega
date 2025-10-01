function extractWebText() {
  let raw = document.body ? document.body.innerText : "";
  return raw.replace(/[\u0000-\u001F\u007F]/g, " ");
}
