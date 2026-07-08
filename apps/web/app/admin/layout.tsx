import Sidebar from "@/components/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <div className="pl-64">
        {children}
      </div>
    </div>
  );
}
