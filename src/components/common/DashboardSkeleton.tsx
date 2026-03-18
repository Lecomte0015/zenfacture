import React from 'react';

/**
 * Composant Skeleton pour afficher une structure de chargement
 * pendant que les données du dashboard se chargent
 */
const DashboardSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="h-8 bg-gray-300 rounded w-48"></div>
        <div className="h-10 bg-gray-300 rounded w-40"></div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="h-4 bg-gray-300 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-300 rounded w-32"></div>
          </div>
        ))}
      </div>

      {/* Recent Invoices */}
      <div className="mt-8">
        <div className="h-6 bg-gray-300 rounded w-40 mb-4"></div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border-b border-gray-200 p-4 flex justify-between items-center">
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-300 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
