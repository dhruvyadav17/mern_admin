import api from "../api/axios";

const getUsers = (params) => {
    return api.get("/users", {
        params
    });
};

const getUser = (id) => {
    return api.get(`/users/${id}`);
};

const createUser = (data) => {
    return api.post(
        "/users",
        data
    );
};

const updateUser = (id, data) => {
    return api.put(
        `/users/${id}`,
        data
    );
};

const deleteUser = (id) => {
    return api.delete(
        `/users/${id}`
    );
};

const updateStatus = (
    id,
    status
) => {
    return api.patch(
        `/users/${id}/status`,
        {
            status
        }
    );
};

export default {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    updateStatus
};