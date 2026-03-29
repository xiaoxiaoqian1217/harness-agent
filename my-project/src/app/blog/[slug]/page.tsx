import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return [{ slug: "getting-started-nextjs" }, { slug: "prisma-orm-guide" }];
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  // In a real app, fetch data from Prisma here
  // const post = await prisma.post.findUnique({ where: { slug } });

  return (
    <article className="container mx-auto max-w-3xl px-4 py-16">
      <Link
        href="/blog"
        className="mb-6 inline-block text-sm text-blue-600 hover:underline"
      >
        ← Back to Blog
      </Link>
      <h1 className="mb-4 text-4xl font-bold">{slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</h1>
      <div className="prose max-w-none">
        <p>This is the content for the blog post.</p>
        <p>In a production environment, this would be fetched from the database.</p>
      </div>
    </article>
  );
}