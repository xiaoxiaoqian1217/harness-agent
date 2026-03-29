export default function AdminDashboard() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="mb-8 text-4xl font-bold">Admin Dashboard</h1>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8">
        <p className="text-gray-600">
          This area is restricted. Authentication logic should be implemented here.
        </p>
        <ul className="mt-4 list-disc pl-5 text-gray-700">
          <li>Create Posts</li>
          <li>Edit Posts</li>
          <li>Delete Posts</li>
          <li>Manage Users</li>
        </ul>
      </div>
    </div>
  );
}