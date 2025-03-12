import { UserEntity } from "../entities";
import { AppDataSource } from "../setup";
import { Repository } from "typeorm";

export const createUser = async (
  data: Partial<UserEntity>
): Promise<Omit<UserEntity, "password"> | null> => {
  const { username, email, password } = data;
  const userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);
  const existingUser = await userRepository.findOne({
    where: { email },
  });
  if (existingUser) {
    return null;
  }

  const user: UserEntity = userRepository.create({ username, email, password });
  await userRepository.save(user);

  return user;
};

export const getOneUser = async (
  data: Partial<Pick<UserEntity, "uuid" | "email">>
): Promise<UserEntity> | null => {
  const userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);
  const findUser: UserEntity = await userRepository.findOne({
    where: { ...data },
  });

  if (!findUser) {
    return null;
  }

  return findUser;
};

export const resetPassword = async (
  data: Pick<UserEntity, "email" | "password">
): Promise<void> | null => {
  const { email, password } = data;
  const userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);
  const findUser: UserEntity = await userRepository.findOne({
    where: { email },
  });

  if (!findUser) {
    return null;
  }

  findUser.password = password;
  await userRepository.save(findUser);
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
