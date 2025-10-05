import { X } from "lucide-react";

// Reusable History Modal Component
function HistoryModal({
    isOpen,
    onClose,
    title,
    subtitle,
    data,
    columns,
    isLoading,
    emptyMessage = "No records found."
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
                        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-auto p-6">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">Loading...</p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">{emptyMessage}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-700 uppercase text-xs sticky top-0">
                                    <tr>
                                        {columns.map((col) => (
                                            <th key={col.key} className="px-4 py-3">
                                                {col.header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {data.map((row, idx) => (
                                        <tr key={row._id || idx} className="hover:bg-gray-50">
                                            {columns.map((col) => (
                                                <td key={col.key} className="px-4 py-3">
                                                    {col.render ? col.render(row) : row[col.key] || "N/A"}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default HistoryModal;