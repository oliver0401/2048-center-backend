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