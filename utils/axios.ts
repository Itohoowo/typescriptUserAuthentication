// // utils/axios.ts

// import axios, { AxiosInstance, InternalAxiosRequestConfig as AxiosRequestConfig, AxiosResponse } from 'axios';
// import router from '../router'; // Ensure the correct path to your router file

// const axiosInstance: AxiosInstance = axios.create({
//   baseURL: process.env.API_BASE_URL || 'http://localhost:8000',
// });

// // Request interceptor
// interface RequestConfig extends AxiosRequestConfig {
//     headers?: Record<string, string>;
// }

// interface RequestInterceptorConfig extends RequestConfig {
//     headers?: Record<string, string>;
// }

// axiosInstance.interceptors.request.use(
//     (config: RequestInterceptorConfig): RequestInterceptorConfig => {
//         const token = localStorage.getItem('token');
//         if (token) {
//             config.headers = config.headers || {};
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error): Promise<never> => Promise.reject(error)
// );

// // Response interceptor
// axiosInstance.interceptors.response.use(
//   (response: AxiosResponse): AxiosResponse => response,
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       localStorage.removeItem('token');
//       router.push('/login');
//     }
//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;