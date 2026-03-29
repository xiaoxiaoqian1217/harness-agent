export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  published: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  views: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: "USER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}