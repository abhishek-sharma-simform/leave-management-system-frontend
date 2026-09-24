import { api } from "@/lib/axios";
import type { LoginResponse } from "@/types";

export function login(email: string, password: string) {
  return api
    .post<LoginResponse>("/auth/login", { email, password })
    .then((res) => res.data);
}
