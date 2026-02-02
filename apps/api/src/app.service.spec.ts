import { AppService } from './app.service';

describe('AppService', () => {
  let appService: AppService;

  beforeEach(() => {
    appService = new AppService();
  });

  describe('getHealth', () => {
    it('should return status ok', () => {
      const result = appService.getHealth();

      expect(result.status).toBe('ok');
    });

    it('should return valid ISO timestamp', () => {
      const result = appService.getHealth();
      const date = new Date(result.timestamp);

      expect(date.toISOString()).toBe(result.timestamp);
    });
  });
});
