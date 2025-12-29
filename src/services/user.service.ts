import { UserEntity } from "../entities";
import { AppDataSource } from "../setup";
import { Repository } from "typeorm";

export const createUser = async (
  data: Partial<UserEntity>
): Promise<Omit<UserEntity, "password"> | null> => {
  const { address, os, src } = data;
  console.log("=================================data=================================");
  console.log(data);
  console.log("=================================data=================================");
  const userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);
  const existingUser = await userRepository.findOne({
    where: { address },
  });
  if (existingUser) {
    return null;
  }

  const user: UserEntity = userRepository.create({ address, os, src });
  await userRepository.save(user);

  return user;
};

export const getOneUser = async (
  data: Partial<UserEntity>
): Promise<UserEntity> | null => {
  const { os, src, ...params } = data;
  const userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);
  const findUser: UserEntity = await userRepository.findOne({
    relations: ["userThemes"],
    where: { address: data.address },
  });

  if (!findUser) {
    const newUser = await createUser({ address: data.address, os: data.os, src: data.src || "" });
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
    relations: ["userThemes"],
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
    relations: ["userThemes"],
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

export const countUsersFromStart = async (
  startDate?: string,
  endDate?: string
): Promise<Array<{ date: string; count: number }>> => {
  const userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);
  
  const queryBuilder = userRepository
    .createQueryBuilder("user")
    .select("DATE(user.created_at)", "date")
    .addSelect("COUNT(*)", "count")
    .groupBy("DATE(user.created_at)");

  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    queryBuilder.where("user.created_at BETWEEN :startDate AND :endDate", {
      startDate: start,
      endDate: end,
    });
  } else if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    queryBuilder.where("user.created_at >= :startDate", {
      startDate: start,
    });
  } else if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    queryBuilder.where("user.created_at <= :endDate", {
      endDate: end,
    });
  }

  queryBuilder.orderBy("DATE(user.created_at)", "ASC");

  const results = await queryBuilder.getRawMany();
  
  return results.map((result) => ({
    date: result.date ? new Date(result.date).toISOString().split("T")[0] : "",
    count: parseInt(result.count, 10),
  }));
};

export const countUsersByOS = async (): Promise<Array<{ os: string; count: number }>> => {
  const userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);
  
  const results = await userRepository
    .createQueryBuilder("user")
    .select("user.os", "os")
    .addSelect("COUNT(*)", "count")
    .groupBy("user.os")
    .getRawMany();
  
  return results.map((result) => ({
    os: result.os || "Unknown",
    count: parseInt(result.count, 10),
  }));
};

export const getUsersPaginated = async (
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'createdAt',
  sortOrder: 'ASC' | 'DESC' = 'DESC'
): Promise<{ users: UserEntity[]; total: number; page: number; limit: number }> => {
  const userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);
  
  const skip = (page - 1) * limit;
  
  // Map frontend column names to database column names
  const validSortColumns: { [key: string]: string } = {
    address: 'address',
    os: 'os',
    maxScore: 'maxScore',
    maxTile: 'maxTile',
    maxMoves: 'maxMoves',
    onboarded: 'onboarded',
    createdAt: 'createdAt',
  };
  
  const columnName = validSortColumns[sortBy] || 'createdAt';
  
  const [users, total] = await userRepository.findAndCount({
    skip,
    take: limit,
    order: {
      [columnName]: sortOrder,
    },
  });
  
  return {
    users,
    total,
    page,
    limit,
  };
};
