import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { DynaVestService } from '../DynaVestService';

// Mock axios
vi.mock('axios')
const mockAxios = vi.mocked(axios)

describe('DynaVestService', () => {
  let service: DynaVestService;

  beforeEach(() => {
    vi.clearAllMocks()
    service = new DynaVestService();
  });

  describe('getDefiRecommendations', () => {
    it('should return AI-powered DeFi recommendations for user input', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { message: 'AI generated strategy' }
        }
      }
      mockAxios.post.mockResolvedValue(mockResponse)

      const userInput = "I want to invest $1000 with moderate risk";
      const userAddress = "0x123...abc";
      
      const result = await service.getDefiRecommendations(userInput, userAddress);
      
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://shuttle-api.dynavest.app/defiInfo',
        {
          input_text: userInput,
          user_address: userAddress
        }
      )
      expect(result).toBeDefined();
      expect(result.response_type).toBe('defi_strategy');
      expect(result.strategy_data).toBeDefined();
      expect(result.strategy_data.recommended_action).toContain('invest');
    });
  });
});