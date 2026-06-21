export default function TrackOrderPage({ params }: { params: { orderNumber: string } }) {
  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Buyurtma: {params.orderNumber}
      </h1>
      <p className="text-gray-500">Tez orada...</p>
    </main>
  );
}
