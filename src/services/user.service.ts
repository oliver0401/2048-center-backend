import { UserEntity } from "../entities";
import { AppDataSource } from "../setup";
import { Repository } from "typeorm";

export const createUser = async (
  data: Partial<UserEntity>
): Promise<Omit<UserEntity, "password"> | null> => {
  const { address } = data;
  const userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);
  const existingUser = await userRepository.findOne({
    where: { address },
  });
  if (existingUser) {
    return null;
  }

  const user: UserEntity = userRepository.create({ address });
  await userRepository.save(user);

  return user;
};

export const getOneUser = async (
  data: Partial<UserEntity>
): Promise<UserEntity> | null => {
  const userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);
  const findUser: UserEntity = await userRepository.findOne({
    relations: ["themes"],
    where: { ...data },
  });

  if (!findUser) {
    const newUser = await createUser({ address: data.address });
    return newUser;
  }

  return findUser;
};

export const updateUser = async (
  data: Partial<UserEntity>
): Promise<UserEntity | null> => {
  const { uuid, ...updateData } = data;
  const userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);

  const findUser: UserEntity = await userRepository.findOne({
    where: { uuid },
  });

  if (!findUser) {
    return null;
  }

  Object.assign(findUser, updateData);
  const updateUser = await userRepository.save(findUser);
  return updateUser;
};

export const updateItem = async (
  uuid: string,
  itemId: string,
  quantity: number
): Promise<UserEntity | null> => {
  const userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);
  const findUser: UserEntity = await userRepository.findOne({
    where: { uuid },
  });

  if (itemId === "hammer") {
    findUser.hammer += quantity;
  }

  if (itemId === "powerup") {
    findUser.powerup += quantity;
  }

  if (itemId === "upgrade") {
    findUser.upgrade += quantity;
  }

  const updateUser = await userRepository.save(findUser);
  return updateUser;
};
