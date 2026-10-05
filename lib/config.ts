// Central place to tweak shop details — safe to edit these strings.
export const config = {
  shopName: "Designer's Shoppe",
  tagline: "By Nancy LoAlbo",

  // Facebook Page identifier for the "Message on Facebook" buttons.
  // Can be a username (facebook.com/DesignersShoppe -> "DesignersShoppe")
  // or a numeric profile/page id. m.me supports both.
  // Points to facebook.com/profile.php?id=61594905849840
  facebookPage: "61594905849840",

  // Categories shown as filters and in the upload dropdown. Edit freely.
  categories: ["Lamps", "Mirrors", "Art & Pictures", "Furniture", "Accents"],
} as const;

export type Category = (typeof config.categories)[number];

// Messenger deep link. Opens the Messenger app on phones, messenger.com on desktop.
// m.me does not support pre-filled message text, so we just open the chat.
export function messengerUrl(): string {
  return `https://m.me/${config.facebookPage}`;
}
