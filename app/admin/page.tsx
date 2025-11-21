
export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-secondary p-6 rounded border border-theme">
          <h3 className="text-lg font-semibold text-primary">Total Courses</h3>
          <p className="text-2xl text-primary">0</p>
        </div>
        <div className="bg-secondary p-6 rounded border border-theme">
          <h3 className="text-lg font-semibold text-primary">Total Services</h3>
          <p className="text-2xl text-primary">0</p>
        </div>
        <div className="bg-secondary p-6 rounded border border-theme">
          <h3 className="text-lg font-semibold text-primary">Contact Submissions</h3>
          <p className="text-2xl text-primary">0</p>
        </div>
        <div className="bg-secondary p-6 rounded border border-theme">
          <h3 className="text-lg font-semibold text-primary">Newsletter Subscribers</h3>
          <p className="text-2xl text-primary">0</p>
        </div>
      </div>
    </div>
  );
}
