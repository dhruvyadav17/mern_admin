const LoadingSpinner = ({
    message = "Loading..."
}) => {
    return (
        <div className="text-center py-5">
            <div
                className="spinner-border text-primary"
                role="status"
            >
                <span className="visually-hidden">
                    Loading...
                </span>
            </div>

            <div className="mt-2 text-muted">
                {message}
            </div>
        </div>
    );
};

export default LoadingSpinner;

