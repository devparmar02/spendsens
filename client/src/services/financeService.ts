import { api } from "@/services/api";
import type { Account, Category, PaginatedResponse, Transaction } from "@/types";

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  categoryId?: string;
  accountId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const transactionService = {
  list: (filters: TransactionFilters = {}) =>
    api.get<{ success: boolean } & PaginatedResponse<Transaction>>("/transactions", {
      params: filters,
    }),
  create: (data: Partial<Transaction>) => api.post<{ data: Transaction }>("/transactions", data),
  update: (id: string, data: Partial<Transaction>) =>
    api.patch<{ data: Transaction }>(`/transactions/${id}`, data),
  remove: (id: string) => api.delete(`/transactions/${id}`),
  duplicate: (id: string) => api.post<{ data: Transaction }>(`/transactions/${id}/duplicate`),
};

export const accountService = {
  list: () => api.get<{ data: Account[]; totalBalance: number }>("/accounts"),
  create: (data: Partial<Account>) => api.post<{ data: Account }>("/accounts", data),
  update: (id: string, data: Partial<Account>) =>
    api.patch<{ data: Account }>(`/accounts/${id}`, data),
  remove: (id: string) => api.delete(`/accounts/${id}`),
  transfer: (data: { fromAccountId: string; toAccountId: string; amount: number; notes?: string }) =>
    api.post("/accounts/transfer", data),
};

export const categoryService = {
  list: (type?: "income" | "expense") =>
    api.get<{ data: Category[] }>("/categories", { params: type ? { type } : {} }),
  create: (data: Partial<Category>) => api.post<{ data: Category }>("/categories", data),
  update: (id: string, data: Partial<Category>) =>
    api.patch<{ data: Category }>(`/categories/${id}`, data),
  remove: (id: string) => api.delete(`/categories/${id}`),
};
