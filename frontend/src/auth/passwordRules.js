// Same rules as the server, checked first so the user does not wait for an answer.
export const PASSWORD_HINT = "לפחות 8 תווים, כולל אות וספרה";

export function checkPassword(password) {
  if (password.length < 8) return "הסיסמה קצרה מדי: לפחות 8 תווים";
  if (!/\p{L}/u.test(password)) return "הסיסמה חייבת לכלול לפחות אות אחת";
  if (!/\p{Nd}/u.test(password)) return "הסיסמה חייבת לכלול לפחות ספרה אחת";
  return null;
}
