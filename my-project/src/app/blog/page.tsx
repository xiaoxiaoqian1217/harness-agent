import Link from "next/link";

export default function BlogPage() {
  // Mock data for initial setup
  const posts = [
    { id: "1", title: "Getting Started with Next.js", slug: "getting-started-nextjs" },
    { id: "2", title: "Prisma ORM Guide", slug: "prisma-orm-guide" },
    { id: "3", title: "Building a Portfolio", slug: "building-a-portfolio" },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="mb-8 text-4xl font-bold">Blog</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="block rounded-lg border border-gray-200 p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="mt-2 text-sm text-gray-600">Read article...</p>
          </Link>
        ))}
      </div>
    </div>
  );
}