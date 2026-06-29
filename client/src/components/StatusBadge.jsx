const STATUS_STYLES = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    APPROVED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
};

export default function StatusBadge({ status }) {
    const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-800 border-gray-200';

    return (
        <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${style}`}
        >
            {status}
        </span>
    );
}

