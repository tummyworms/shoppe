export type Item = {
  id: string;
  title: string;
  category: string;
  note?: string; // free text: dimensions, condition, story, etc.
  images: string[]; // public URLs (e.g. /uploads/xyz.jpg)
  sold: boolean;
  createdAt: number; // epoch ms
};
