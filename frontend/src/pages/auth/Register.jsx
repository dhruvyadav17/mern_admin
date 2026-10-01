import { Link } from "react-router-dom";

const Register = () => {
    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-5">

                    <div className="card shadow-sm">
                        <div className="card-body">

                            <h3 className="mb-4">
                                Register
                            </h3>

                            <p>
                                Register page
                            </p>

                            <Link
                                to="/login"
                                className="btn btn-primary"
                            >
                                Go to Login
                            </Link>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Register;