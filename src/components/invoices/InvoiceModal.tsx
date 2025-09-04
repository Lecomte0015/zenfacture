import { Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX, FiPrinter, FiDownload } from 'react-icons/fi';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    client: string;
    amount: string;
    date: string;
    dueDate: string;
    status: string;
  };
}

export const InvoiceModal = ({ isOpen, onClose, invoice }: InvoiceModalProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;
    
    if (printContent) {
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  const handleDownload = () => {
    // Cette fonction sera implémentée avec une vraie génération de PDF
    const link = document.createElement('a');
    link.href = `#`; // Remplacer par l'URL de l'API de génération de PDF
    link.download = `facture-${invoice.id}.pdf`;
    link.click();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fermer</span>
                    <FiX className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="flex justify-between items-start">
                      <div>
                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                          Facture #{invoice.id}
                        </Dialog.Title>
                        <p className="mt-1 text-sm text-gray-500">
                          Client: {invoice.client}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={handleDownload}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FiDownload className="-ml-0.5 mr-2 h-4 w-4" />
                          Télécharger
                        </button>
                        <button
                          type="button"
                          onClick={handlePrint}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FiPrinter className="-ml-0.5 mr-2 h-4 w-4" />
                          Imprimer
                        </button>
                      </div>
                    </div>
                    
                    <div ref={printRef} className="mt-6 p-6 bg-white rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h2 className="text-2xl font-bold">ZenFacture</h2>
                          <p className="text-gray-600">Gestion de facturation simplifiée</p>
                        </div>
                        <div className="text-right">
                          <h1 className="text-2xl font-bold text-gray-900">FACTURE</h1>
                          <p className="text-sm text-gray-500">N° {invoice.id}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Facturé à</h3>
                          <p className="mt-1 text-sm text-gray-900">
                            {invoice.client}<br />
                            Client Adresse<br />
                            Ville, Code postal<br />
                            Pays
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="mb-4">
                            <h3 className="text-sm font-medium text-gray-500">Date d'émission</h3>
                            <p className="mt-1 text-sm text-gray-900">{invoice.date}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Date d'échéance</h3>
                            <p className="mt-1 text-sm text-gray-900">{invoice.dueDate}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                Description
                              </th>
                              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                                Montant
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-0">
                                Facture de service
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                                {invoice.amount} CHF
                              </td>
                            </tr>
                          </tbody>
                          <tfoot>
                            <tr>
                              <th scope="row" colSpan={1} className="hidden sm:table-cell pt-6 pl-4 pr-3 text-right text-sm font-semibold text-gray-900 sm:pl-0">
                                Total
                              </th>
                              <td className="pt-6 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 sm:pr-0">
                                {invoice.amount} CHF
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      
                      <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500">
                        <p>Merci pour votre confiance.</p>
                        <p className="mt-2">Veuillez régler cette facture avant le {invoice.dueDate}.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default InvoiceModal;
