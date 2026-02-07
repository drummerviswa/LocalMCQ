import axios from "axios";

const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || "https://local-mcq.vercel.app/api",
    // baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000/api",
    withCredentials: true
})

export default instance;