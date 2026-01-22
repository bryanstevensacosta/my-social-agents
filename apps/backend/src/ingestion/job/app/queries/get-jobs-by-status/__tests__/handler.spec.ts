import { Test, TestingModule } from '@nestjs/testing';
import { GetJobsByStatusQueryHandler } from '../handler';
import { GetJobsByStatusQuery } from '../query';
import { IIngestionJobReadRepository } from '@/ingestion/job/app/queries/repositories/ingestion-job-read';
import { JobByStatusItemResponse } from '../response';

describe('GetJobsByStatusQueryHandler', () => {
  let handler: GetJobsByStatusQueryHandler;
  let mockJobReadRepository: jest.Mocked<IIngestionJobReadRepository>;

  beforeEach(async () => {
    mockJobReadRepository = {
      findById: jest.fn(),
      findByStatus: jest.fn(),
      countByStatus: jest.fn(),
      findBySourceId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetJobsByStatusQueryHandler,
        {
          provide: 'IIngestionJobReadRepository',
          useValue: mockJobReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetJobsByStatusQueryHandler>(
      GetJobsByStatusQueryHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return paginated jobs with total count', async () => {
      // Arrange
      const status = 'COMPLETED';
      const limit = 10;
      const offset = 0;

      const mockJobs: JobByStatusItemResponse[] = [
        {
          jobId: 'job-1',
          sourceId: 'source-1',
          status: 'COMPLETED',
          scheduledAt: new Date('2024-01-01T00:00:00Z'),
          executedAt: new Date('2024-01-01T00:01:00Z'),
          completedAt: new Date('2024-01-01T00:05:00Z'),
          itemsCollected: 10,
          duplicatesDetected: 2,
          errorsEncountered: 0,
          bytesProcessed: 1024,
          durationMs: 240000,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-01T00:05:00Z'),
        },
        {
          jobId: 'job-2',
          sourceId: 'source-2',
          status: 'COMPLETED',
          scheduledAt: new Date('2024-01-02T00:00:00Z'),
          executedAt: new Date('2024-01-02T00:01:00Z'),
          completedAt: new Date('2024-01-02T00:05:00Z'),
          itemsCollected: 5,
          duplicatesDetected: 1,
          errorsEncountered: 0,
          bytesProcessed: 512,
          durationMs: 120000,
          createdAt: new Date('2024-01-02T00:00:00Z'),
          updatedAt: new Date('2024-01-02T00:05:00Z'),
        },
      ];

      const expectedJobs: JobByStatusItemResponse[] = [
        {
          jobId: 'job-1',
          sourceId: 'source-1',
          status: 'COMPLETED',
          scheduledAt: new Date('2024-01-01T00:00:00Z'),
          executedAt: new Date('2024-01-01T00:01:00Z'),
          completedAt: new Date('2024-01-01T00:05:00Z'),
          itemsCollected: 10,
          duplicatesDetected: 2,
          errorsEncountered: 0,
          bytesProcessed: 1024,
          durationMs: 240000,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-01T00:05:00Z'),
        },
        {
          jobId: 'job-2',
          sourceId: 'source-2',
          status: 'COMPLETED',
          scheduledAt: new Date('2024-01-02T00:00:00Z'),
          executedAt: new Date('2024-01-02T00:01:00Z'),
          completedAt: new Date('2024-01-02T00:05:00Z'),
          itemsCollected: 5,
          duplicatesDetected: 1,
          errorsEncountered: 0,
          bytesProcessed: 512,
          durationMs: 120000,
          createdAt: new Date('2024-01-02T00:00:00Z'),
          updatedAt: new Date('2024-01-02T00:05:00Z'),
        },
      ];

      mockJobReadRepository.findByStatus.mockResolvedValue({
        jobs: mockJobs,
        total: 25,
      });
      mockJobReadRepository.countByStatus.mockResolvedValue(25);

      const query = new GetJobsByStatusQuery(status, limit, offset);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.jobs).toEqual(expectedJobs);
      expect(result.total).toBe(25);
      expect(mockJobReadRepository.findByStatus).toHaveBeenCalledWith(
        status,
        limit,
        offset,
      );
    });

    it('should handle different statuses', async () => {
      // Arrange
      const status = 'FAILED';
      const mockJobs: JobByStatusItemResponse[] = [
        {
          jobId: 'job-3',
          sourceId: 'source-3',
          status: 'FAILED',
          scheduledAt: new Date('2024-01-03T00:00:00Z'),
          executedAt: new Date('2024-01-03T00:01:00Z'),
          completedAt: null,
          itemsCollected: 0,
          duplicatesDetected: 0,
          errorsEncountered: 1,
          bytesProcessed: 0,
          durationMs: 5000,
          createdAt: new Date('2024-01-03T00:00:00Z'),
          updatedAt: new Date('2024-01-03T00:01:05Z'),
        },
      ];

      const expectedJobs: JobByStatusItemResponse[] = [
        {
          jobId: 'job-3',
          sourceId: 'source-3',
          status: 'FAILED',
          scheduledAt: new Date('2024-01-03T00:00:00Z'),
          executedAt: new Date('2024-01-03T00:01:00Z'),
          completedAt: null,
          itemsCollected: 0,
          duplicatesDetected: 0,
          errorsEncountered: 1,
          bytesProcessed: 0,
          durationMs: 5000,
          createdAt: new Date('2024-01-03T00:00:00Z'),
          updatedAt: new Date('2024-01-03T00:01:05Z'),
        },
      ];

      mockJobReadRepository.findByStatus.mockResolvedValue({
        jobs: mockJobs,
        total: 3,
      });

      const query = new GetJobsByStatusQuery(status);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.jobs).toEqual(expectedJobs);
      expect(result.total).toBe(3);
      expect(mockJobReadRepository.findByStatus).toHaveBeenCalledWith(
        status,
        undefined,
        undefined,
      );
    });

    it('should handle pagination with offset', async () => {
      // Arrange
      const status = 'RUNNING';
      const limit = 5;
      const offset = 10;

      mockJobReadRepository.findByStatus.mockResolvedValue({
        jobs: [],
        total: 15,
      });

      const query = new GetJobsByStatusQuery(status, limit, offset);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.jobs).toEqual([]);
      expect(result.total).toBe(15);
      expect(mockJobReadRepository.findByStatus).toHaveBeenCalledWith(
        status,
        limit,
        offset,
      );
    });

    it('should return empty array when no jobs match status', async () => {
      // Arrange
      const status = 'PENDING';
      mockJobReadRepository.findByStatus.mockResolvedValue({
        jobs: [],
        total: 0,
      });

      const query = new GetJobsByStatusQuery(status);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.jobs).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const status = 'COMPLETED';
      const error = new Error('Database connection failed');
      mockJobReadRepository.findByStatus.mockRejectedValue(error);

      const query = new GetJobsByStatusQuery(status);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
