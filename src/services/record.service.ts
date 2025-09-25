import { AppDataSource } from "../setup/database.setup";
import { RecordEntity, UserEntity } from "../entities";

export class RecordService {
  private recordRepository = AppDataSource.getRepository(RecordEntity);

  async saveRecord(recordData: {
    user: UserEntity;
    date: Date;
    move: number;
    score: number;
    rows: number;
    cols: number;
    playTime: number;
    playHistoryUrl?: string;
  }): Promise<RecordEntity> {
    const record = this.recordRepository.create(recordData);
    return await this.recordRepository.save(record);
  }

  async getRecordsByUserId(userId: string, limit: number = 10, offset: number = 0): Promise<RecordEntity[]> {
    return await this.recordRepository.find({
      where: { user: { uuid: userId } },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset
    });
  }

  async getRecordById(recordId: string): Promise<RecordEntity | null> {
    return await this.recordRepository.findOne({
      where: { uuid: recordId }
    });
  }

  async deleteRecord(recordId: string, userId: string): Promise<boolean> {
    const result = await this.recordRepository.delete({
      uuid: recordId,
      user: { uuid: userId }
    });
    return result.affected !== 0;
  }

  async searchRecords(options: {
    userId?: string;
    date?: string;
    sortBy?: 'score' | 'moves' | 'date';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{ records: RecordEntity[]; total: number }> {
    const {
      userId,
      date,
      sortBy = 'date',
      sortOrder = 'desc',
      limit = 10,
      offset = 0
    } = options;

    const queryBuilder = this.recordRepository.createQueryBuilder('record')
      .leftJoinAndSelect('record.user', 'user');

    // Filter by user if provided
    if (userId) {
      queryBuilder.andWhere('user.uuid = :userId', { userId });
    }

    // Filter by date if provided
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      queryBuilder.andWhere('record.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      });
    }

    // Apply sorting
    let orderField: string;
    switch (sortBy) {
      case 'score':
        orderField = 'record.score';
        break;
      case 'moves':
        orderField = 'record.move';
        break;
      case 'date':
      default:
        orderField = 'record.date';
        break;
    }

    queryBuilder.orderBy(orderField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    // Apply pagination
    queryBuilder.skip(offset).take(limit);

    // Get total count for pagination
    const totalQueryBuilder = this.recordRepository.createQueryBuilder('record')
      .leftJoin('record.user', 'user');

    if (userId) {
      totalQueryBuilder.andWhere('user.uuid = :userId', { userId });
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      totalQueryBuilder.andWhere('record.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      });
    }

    const [records, total] = await Promise.all([
      queryBuilder.getMany(),
      totalQueryBuilder.getCount()
    ]);

    return { records, total };
  }

  async getRecordsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ records: RecordEntity[]; total: number }> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const queryBuilder = this.recordRepository.createQueryBuilder('record')
      .leftJoinAndSelect('record.user', 'user')
      .where('user.uuid = :userId', { userId })
      .andWhere('record.date BETWEEN :startDate AND :endDate', {
        startDate: start,
        endDate: end
      })
      .orderBy('record.date', 'DESC')
      .skip(offset)
      .take(limit);

    const totalQueryBuilder = this.recordRepository.createQueryBuilder('record')
      .leftJoin('record.user', 'user')
      .where('user.uuid = :userId', { userId })
      .andWhere('record.date BETWEEN :startDate AND :endDate', {
        startDate: start,
        endDate: end
      });

    const [records, total] = await Promise.all([
      queryBuilder.getMany(),
      totalQueryBuilder.getCount()
    ]);

    return { records, total };
  }
}

export const recordService = new RecordService();
