import { MESSAGE } from "consts";
import { SubscribeEntity } from "entities";
import { DuplicateError } from "errors";
import { AppDataSource } from "setup";
import { Repository } from "typeorm";

export const createSubscribe = async (data: Partial<SubscribeEntity>) => {
  const { email } = data;
  const subscribeRepository: Repository<SubscribeEntity> =
    AppDataSource.getRepository(SubscribeEntity);
  const existingSubscribe = await subscribeRepository.findOne({ where: { email } });
  if (existingSubscribe) {
    throw new DuplicateError(MESSAGE.ERROR.SUBSCRIBE_ALREADY_EXISTS);
  }
  const subscribe = await subscribeRepository.create({ email });
  await subscribeRepository.save(subscribe);
  return subscribe;
};

export const countDailySubscribers = async (
  startDate?: string,
  endDate?: string
): Promise<Array<{ date: string; count: number }>> => {
  const subscribeRepository: Repository<SubscribeEntity> =
    AppDataSource.getRepository(SubscribeEntity);
  
  const queryBuilder = subscribeRepository
    .createQueryBuilder("subscribe")
    .select("DATE(subscribe.created_at)", "date")
    .addSelect("COUNT(*)", "count")
    .groupBy("DATE(subscribe.created_at)");

  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    queryBuilder.where("subscribe.created_at BETWEEN :startDate AND :endDate", {
      startDate: start,
      endDate: end,
    });
  } else if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    queryBuilder.where("subscribe.created_at >= :startDate", {
      startDate: start,
    });
  } else if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    queryBuilder.where("subscribe.created_at <= :endDate", {
      endDate: end,
    });
  }

  queryBuilder.orderBy("DATE(subscribe.created_at)", "ASC");

  const results = await queryBuilder.getRawMany();
  
  return results.map((result) => ({
    date: result.date ? new Date(result.date).toISOString().split("T")[0] : "",
    count: parseInt(result.count, 10),
  }));
};