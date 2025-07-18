import axios from 'axios';

const SHUTTLE_API_BASE_URL = process.env.NEXT_PUBLIC_SHUTTLE_API_URL || 'http://localhost:8000';

export interface Strategy {
  id?: string;
  name: string;
  risk_level: number;
  parameters: string;
}

export interface StrategyInput {
  account: string;
  strategy: Strategy;
}

export interface UpdateStrategyInput {
  account: string;
  strategyId: string;
  strategy: Strategy;
}

export interface DeleteStrategyInput {
  account: string;
  strategyId: string;
}

export interface StrategyResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export const saveStrategy = async (input: StrategyInput): Promise<StrategyResponse> => {
  try {
    const response = await axios.post(`${SHUTTLE_API_BASE_URL}/strategies`, input);
    return response.data;
  } catch (error) {
    console.error('Error saving strategy:', error);
    throw error;
  }
};

export const loadStrategies = async (account: string): Promise<Strategy[]> => {
  try {
    const response = await axios.get(`${SHUTTLE_API_BASE_URL}/strategies/${account}`);
    return response.data;
  } catch (error) {
    console.error('Error loading strategies:', error);
    throw error;
  }
};

export const updateStrategy = async (input: UpdateStrategyInput): Promise<StrategyResponse> => {
  try {
    const requestBody = {
      account: input.account,
      strategy_id: input.strategyId,
      strategy: input.strategy
    };
    const response = await axios.put(`${SHUTTLE_API_BASE_URL}/strategies/${input.strategyId}`, requestBody);
    return response.data;
  } catch (error) {
    console.error('Error updating strategy:', error);
    throw error;
  }
};

export const deleteStrategy = async (input: DeleteStrategyInput): Promise<StrategyResponse> => {
  try {
    const requestBody = {
      account: input.account,
      strategy_id: input.strategyId
    };
    const response = await axios.delete(`${SHUTTLE_API_BASE_URL}/strategies/${input.strategyId}`, {
      data: requestBody
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting strategy:', error);
    throw error;
  }
};