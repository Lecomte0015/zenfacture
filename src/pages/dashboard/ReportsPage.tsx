import React, { useState } from 'react';
import { Download, BarChart2, FileText, PieChart, LineChart } from 'lucide-react';

// Composants UI simplifiés
const Button = ({
  children,
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
  [key: string]: any;
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'hover:bg-gray-100',
  };
  const sizes = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-9 px-3 text-sm',
    icon: 'h-10 w-10',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
    {children}
  </div>
);

const Tabs = ({ children, defaultTab }: { children: React.ReactNode, defaultTab: string }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const childrenArray = React.Children.toArray(children);
  const tabs = childrenArray.filter(child => 
    React.isValidElement(child) && child.type === TabsList
  ).flatMap(child => 
    React.Children.toArray(child.props.children)
  );
  
  const panels = childrenArray.filter(child => 
    React.isValidElement(child) && child.type === TabPanel
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab: any) => (
            <button
              key={tab.props.value}
              onClick={() => setActiveTab(tab.props.value)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.props.value
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.props.children}
            </button>
          ))}
        </nav>
      </div>
      
      {panels.find((panel: any) => panel.props.value === activeTab) || null}
    </div>
  );
};

const TabsList = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const TabPanel = ({ children, value }: { children: React.ReactNode, value: string }) => {
  return <div>{children}</div>;
};

const StatCard = ({ title, value, change, icon: Icon }: { 
  title: string; 
  value: string; 
  change?: { value: string; type: 'increase' | 'decrease' };
  icon: React.ElementType;
}) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
              {change && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change.type === 'increase' ? '↑' : '↓'} {change.value}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const ReportsPage = () => {
  // Données factices pour les graphiques
  const financialData = {
    revenue: '24,567 €',
    expenses: '12,340 €',
    profit: '12,227 €',
    profitChange: { value: '12%', type: 'increase' as const },
  };

  const invoiceData = [
    { month: 'Jan', paid: 4000, unpaid: 2400 },
    { month: 'Fév', paid: 3000, unpaid: 1398 },
    { month: 'Mar', paid: 2000, unpaid: 9800 },
    { month: 'Avr', paid: 2780, unpaid: 3908 },
    { month: 'Mai', paid: 1890, unpaid: 4800 },
    { month: 'Juin', paid: 2390, unpaid: 3800 },
  ];

  const expenseData = [
    { name: 'Fournitures', value: 35 },
    { name: 'Logiciels', value: 25 },
    { name: 'Déplacements', value: 20 },
    { name: 'Formation', value: 15 },
    { name: 'Autres', value: 5 },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="text-gray-500">
            Analysez les performances de votre entreprise
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exporter le rapport
        </Button>
      </div>

      <Tabs defaultTab="financial">
        <TabsList>
          <div value="financial">Financier</div>
          <div value="invoices">Factures</div>
          <div value="expenses">Dépenses</div>
        </TabsList>

        <TabPanel value="financial">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard 
                title="Chiffre d'affaires" 
                value={financialData.revenue} 
                icon={BarChart2} 
              />
              <StatCard 
                title="Dépenses" 
                value={financialData.expenses} 
                icon={FileText} 
              />
              <StatCard 
                title="Bénéfice" 
                value={financialData.profit} 
                change={financialData.profitChange}
                icon={LineChart} 
              />
              <StatCard 
                title="Marge bénéficiaire" 
                value="49.8%" 
                change={{ value: '5.2%', type: 'increase' }}
                icon={PieChart} 
              />
            </div>

            <Card>
              <h3 className="text-lg font-medium mb-4">Évolution du chiffre d'affaires</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md">
                <p className="text-gray-500">Graphique d'évolution du CA à venir</p>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Card>
                <h3 className="text-lg font-medium mb-4">Répartition des revenus</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-gray-500">Graphique en secteurs à venir</p>
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-medium mb-4">Dépenses par catégorie</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-gray-500">Graphique à barres à venir</p>
                </div>
              </Card>
            </div>
          </div>
        </TabPanel>

        <TabPanel value="invoices">
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-medium mb-4">Factures payées vs impayées</h3>
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded-md">
                <p className="text-gray-500">Graphique de facturation à venir</p>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Card>
                <h3 className="text-lg font-medium mb-4">Taux de paiement</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-gray-500">Graphique circulaire à venir</p>
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-medium mb-4">Retards de paiement</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-gray-500">Graphique de retard à venir</p>
                </div>
              </Card>
            </div>
          </div>
        </TabPanel>

        <TabPanel value="expenses">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard 
                title="Dépenses totales" 
                value="12,340 €" 
                change={{ value: '8.2%', type: 'increase' }}
                icon={FileText} 
              />
              <StatCard 
                title="Moyenne mensuelle" 
                value="1,028 €" 
                change={{ value: '3.5%', type: 'decrease' }}
                icon={BarChart2} 
              />
              <StatCard 
                title="Catégorie principale" 
                value="Fournitures (35%)" 
                icon={PieChart} 
              />
            </div>

            <Card>
              <h3 className="text-lg font-medium mb-4">Dépenses par catégorie</h3>
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded-md">
                <p className="text-gray-500">Graphique de répartition des dépenses à venir</p>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Card>
                <h3 className="text-lg font-medium mb-4">Tendance des dépenses</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-gray-500">Graphique d'évolution à venir</p>
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-medium mb-4">Dépenses par fournisseur</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-gray-500">Graphique des fournisseurs à venir</p>
                </div>
              </Card>
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
