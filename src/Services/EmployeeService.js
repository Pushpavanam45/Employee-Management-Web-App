import axios from "axios";

const REST_API_BASE_URL = 'http://localhost:8080/api/employees';

// ✅ Get all employees
export const listEmployees = () => {
    return axios.get(REST_API_BASE_URL);
};

// ✅ Create new employee
export const createEmployee = (employee) => {
    return axios.post(REST_API_BASE_URL, employee);
};

// ✅ Get employee by ID
export const getEmployee = (employeeId) => {
    return axios.get(`${REST_API_BASE_URL}/${employeeId}`);
};

// ✅ Update employee by ID
export const updateEmployee = (employeeId, employee) => {
    return axios.put(`${REST_API_BASE_URL}/${employeeId}`, employee);
};

export const deleteEmployee = (employeeId) => {
    return axios.delete(`${REST_API_BASE_URL}/${employeeId}`);
}