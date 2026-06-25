// Server actions echo back submitted field values on validation failure so
// forms can restore them as `defaultValue` instead of resetting to blank
// (React resets uncontrolled fields to `defaultValue` after every form action).
export function formDataToStringValues(
  formData: FormData,
  fields: string[],
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of fields) {
    const value = formData.get(field);
    if (typeof value === "string") values[field] = value;
  }
  return values;
}
