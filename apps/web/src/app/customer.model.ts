export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  dni: string;
  email?: string;
  points: number;
}

export interface ApiError {
  error?: {
    message?: string | string[];
  };
}
