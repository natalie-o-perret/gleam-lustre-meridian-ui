export function normalise(value) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();
}
