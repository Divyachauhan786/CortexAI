import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../store/authSlice";

const Home = () => {

    const dispatch = useDispatch();

    const user = useSelector(
        (state) => state.auth.user
    );


    const handleLogout = () => {
        dispatch(logoutUser());
    };


    return (
        <div style={{
            padding: "40px",
        }}>

            <h1>
                Welcome to AI Workspace 🚀
            </h1>

            {user && (
                <>
                    <h2>
                        Hello, {user.name}
                    </h2>

                    <p>
                        Email: {user.email}
                    </p>

                    <p>
                        Credits: {user.credits}
                    </p>

                    <button onClick={handleLogout}>
                        Logout
                    </button>
                </>
            )}

        </div>
    );
};

export default Home;