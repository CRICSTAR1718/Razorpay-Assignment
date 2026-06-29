export default function Spinner({ className = '' }) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
        </div>
    );
}

