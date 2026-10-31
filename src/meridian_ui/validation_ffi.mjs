import { Ok, Error as GleamError, toList } from "../gleam.mjs";
import { FieldError } from "./validation.mjs";

export function check(id) {
  const form = globalThis.document?.getElementById(id);
  if (form?.localName !== "form")
    return new GleamError("The validation form is unavailable.");
  const errors = [];
  for (const control of form.elements) {
    if (!control.willValidate || control.validity.valid) continue;
    if (!control.id)
      return new GleamError("Every validated field needs a unique ID.");
    errors.push(new FieldError(control.id, control.validationMessage));
  }
  return new Ok(toList(errors));
}
