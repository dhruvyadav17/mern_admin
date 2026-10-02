const EmptyState = ({ message = "No records found" }) => {
    return (
        <div className="text-center py-4 text-muted">
            {message}
        </div>
    );
};

export default EmptyState;
