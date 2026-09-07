const authMiddleware = async (req, res, next) => {
    try {
        const response = await fetch(
            `${process.env.AUTH_SERVICE}/auth/me`,
            {
                method: "GET",
                headers: {
                    cookie: req.headers.cookie || "",
                },
            }
        );

        if (!response.ok) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const data = await response.json();

        req.user = data.user;

        next();

    } catch (error) {
        console.error(
            "Chat auth error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Authentication service unavailable",
        });
    }
};

export default authMiddleware;