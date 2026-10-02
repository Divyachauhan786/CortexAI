const formatDuration = (startTime) => {
    return `${Date.now() - startTime}ms`;
};

export const logAgentStart = ({
    agent,
    iteration = 0,
}) => {
    console.log(
        `[Agent:${agent}] START | iteration=${iteration}`
    );

    return Date.now();
};

export const logAgentSuccess = ({
    agent,
    startTime,
    iteration = 0,
    metadata = {},
}) => {
    console.log(
        `[Agent:${agent}] SUCCESS | duration=${formatDuration(
            startTime
        )} | iteration=${iteration}`,
        metadata
    );
};

export const logAgentError = ({
    agent,
    startTime,
    iteration = 0,
    error,
}) => {
    console.error(
        `[Agent:${agent}] ERROR | duration=${formatDuration(
            startTime
        )} | iteration=${iteration} | message=${error?.message || error}`
    );
};