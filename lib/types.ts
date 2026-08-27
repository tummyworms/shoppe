export type Item = {
  id: string;
  title: string;
  category: string;
  price?: string; // free text, e.g. "145" or "$145"; empty = "Message for price"
  note?: string; // free text: dimensions, condition, story, etc.
  images: string[]; // public URLs (e.g. /uploads/xyz.jpg)
  sold: boolean;
  createdAt: number; // epoch ms
};
