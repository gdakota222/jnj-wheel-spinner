/**
 * Where the app asks for support, and where that support goes.
 *
 * Every outward-facing link in the app is here, and nowhere else. These are the
 * only addresses the app sends anybody to, so changing one should be a
 * deliberate edit to a file that exists for that purpose — not a hunt through a
 * screen full of markup.
 *
 * An empty handle means "not set up yet". The About page then says so plainly
 * rather than rendering a button that leads nowhere, which is worse than no
 * button at all: a dead donate link reads as a broken app, or a scam.
 */

/** Ko-fi username, from ko-fi.com/<handle>. Empty until the account exists. */
export const KOFI_HANDLE = 'slowjamslabs';

/**
 * Venmo username, from venmo.com/u/<handle>. A Venmo profile is public and
 * carries the account holder's real name, and a giver needs the app installed;
 * Ko-fi asks neither of those, which is why Ko-fi is listed first. The owner set
 * this deliberately on 2026-10-24: most dancers already have Venmo and it has no
 * fee. If tips become regular, a Venmo business profile is the upgrade path.
 *
 * After changing either handle, run `npm run qr` to redraw the QR codes.
 */
export const VENMO_HANDLE = 'dakota-gibbs';

export type SupportLink = {
  /** What the button says. */
  label: string;
  /** What happens when it is pressed, said before it is pressed. */
  note: string;
  url: string;
};

/**
 * The support links that are actually usable right now.
 *
 * Built at call time from the handles above, so an unset handle simply does not
 * appear.
 */
export function supportLinks(): SupportLink[] {
  const links: SupportLink[] = [];
  if (KOFI_HANDLE) {
    links.push({
      label: 'Buy me a boba on Ko-fi',
      note: 'Opens ko-fi.com. No account needed to give: card, Apple Pay, or Google Pay.',
      url: `https://ko-fi.com/${KOFI_HANDLE}`,
    });
  }
  if (VENMO_HANDLE) {
    links.push({
      label: 'Send a boba on Venmo',
      note: 'Opens Venmo. You will need the Venmo app or an account.',
      url: `https://venmo.com/u/${VENMO_HANDLE}`,
    });
  }
  return links;
}
